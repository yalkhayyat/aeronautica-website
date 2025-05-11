"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import {
  X,
  Plus,
  Upload,
  Code,
  Check,
  ChevronsUpDown,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import { useSupabase } from "@/lib/supabase-provider";
import AIRCRAFT_TYPES from "@/data/aircraft-types.json";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const formSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  aircraft: z.string().min(1, "Aircraft is required"),
  textureIds: z
    .array(
      z.object({
        name: z
          .string()
          .min(1, "Name is required")
          .max(50, "Name must be 50 characters or less"),
        id: z
          .string()
          .min(1, "ID is required")
          .max(50, "ID must be 50 characters or less"),
      })
    )
    .min(1, "At least one Texture ID is required"),
  images: z
    .array(
      z
        .custom<File>(
          (file) => file instanceof File,
          "Please upload a valid file"
        )
        .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
        .refine(
          (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
          "Only .jpg, .png, and .webp formats are supported."
        )
    )
    .min(1, "At least one image is required")
    .max(5, "Maximum 5 images allowed"),
  advancedCustomization: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function UploadLiveryPage() {
  const [imagePreview, setImagePreview] = useState<
    Array<{ url: string; file: File }>
  >([]);
  const [showAdvancedCustomization, setShowAdvancedCustomization] =
    useState(false);
  const [isAircraftPopoverOpen, setIsAircraftPopoverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJsonValid, setIsJsonValid] = useState(true);
  const { toast } = useToast();
  const { user } = useUser();
  const supabase = useSupabase();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      aircraft: "",
      textureIds: [{ name: "", id: "" }],
      images: [],
      advancedCustomization: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "textureIds",
  });

  const validateJson = (value: string) => {
    if (!value) {
      setIsJsonValid(true);
      return true;
    }
    try {
      JSON.parse(value);
      setIsJsonValid(true);
      return true;
    } catch {
      setIsJsonValid(false);
      return false;
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload a livery.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    if (!validateJson(values.advancedCustomization || "")) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload images to Supabase storage
      const imageUrls = await Promise.all(
        values.images.map(async (file) => {
          const fileName = `${user.id}/${Date.now()}-${file.name}`;
          const { error } = await supabase.storage
            .from("livery-images")
            .upload(fileName, file, {
              metadata: { owner: user.id },
            });

          if (error) throw error;

          const { data: publicUrl } = supabase.storage
            .from("livery-images")
            .getPublicUrl(fileName);

          return publicUrl.publicUrl;
        })
      );

      // Prepare data for database insertion
      const liveryData = {
        user_id: user.id,
        title: values.title,
        description: values.description || null,
        vehicle_name: values.aircraft,
        vehicle_type: values.aircraft, // Added for consistency with database schema
        images: imageUrls,
        advanced_customization: values.advancedCustomization
          ? JSON.parse(values.advancedCustomization)
          : null,
        texture_ids: values.textureIds,
      };

      // Insert data into Supabase
      const { error } = await supabase
        .from("liveries")
        .insert([liveryData])
        .select();

      if (error) throw error;

      toast({
        title: "Livery uploaded successfully!",
        description: "Thanks for contributing!",
        duration: 5000,
      });

      // Reset form after successful submission
      form.reset();
      setImagePreview([]);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description:
          "There was a problem uploading your livery. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: File[]) => void
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Get current files
    const currentFiles = form.getValues("images") || [];
    const currentFileNames = imagePreview.map((preview) => preview.file.name);

    // Filter for valid files (size and type)
    const validFiles = files.filter(
      (file) =>
        file.size <= MAX_FILE_SIZE && ACCEPTED_IMAGE_TYPES.includes(file.type)
    );

    if (validFiles.length === 0) {
      toast({
        title: "No valid files",
        description:
          "All files were skipped due to size or format restrictions.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    } else if (validFiles.length < files.length) {
      toast({
        title: "Some files skipped",
        description:
          "Some files were skipped due to size or format restrictions.",
        variant: "destructive",
        duration: 5000,
      });
    }

    // Check for duplicates by file name
    const duplicateFiles = validFiles.filter((file) =>
      currentFileNames.includes(file.name)
    );

    const uniqueValidFiles = validFiles.filter(
      (file) => !currentFileNames.includes(file.name)
    );

    // Show toast when duplicates are detected
    if (duplicateFiles.length > 0) {
      toast({
        title: `${duplicateFiles.length} duplicate file${
          duplicateFiles.length > 1 ? "s" : ""
        } detected`,
        description: "Duplicate images have been skipped.",
        duration: 3000,
      });
    }

    // If no unique valid files to add after filtering duplicates, exit early
    if (uniqueValidFiles.length === 0) {
      return;
    }

    // Enforce the 5 image limit
    const availableSlots = 5 - currentFiles.length;

    if (availableSlots <= 0) {
      toast({
        title: "Image limit reached",
        description: "You've already reached the maximum of 5 images.",
        duration: 3000,
      });
      return;
    }

    const filesToAdd = uniqueValidFiles.slice(0, availableSlots);

    if (filesToAdd.length < uniqueValidFiles.length) {
      toast({
        title: "Image limit reached",
        description: `Only ${filesToAdd.length} image(s) were added to stay within the 5 image limit.`,
        duration: 3000,
      });
    }

    // Update form value with the new files
    const updatedFiles = [...currentFiles, ...filesToAdd];
    onChange(updatedFiles);

    // Update preview with the new files
    const newPreviews = filesToAdd.map((file) => ({
      url: URL.createObjectURL(file),
      file: file,
    }));

    setImagePreview((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index: number) => {
    // Get current files
    const currentFiles = form.getValues("images") || [];

    // Find the file to remove
    const fileToRemove = imagePreview[index].file;

    // Filter out the file from form values
    const updatedFiles = currentFiles.filter((file) => file !== fileToRemove);

    // Update form value
    form.setValue("images", updatedFiles, { shouldValidate: true });

    // Update preview
    setImagePreview((prev) => {
      const updated = [...prev];
      // Revoke the object URL to avoid memory leaks
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="space-y-4 mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary/80 to-primary">
          Upload Livery
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Share your custom livery with the aviation community. High-quality
          images and accurate texture IDs will help others use your design.
        </p>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-md">
        <div className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="bg-muted/30 backdrop-blur-sm rounded-lg p-6 space-y-6">
                    <h2 className="text-xl font-semibold border-b pb-2">
                      Livery Details
                    </h2>
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Title
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter livery title"
                              className="bg-background/50"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Description
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter livery description"
                              className="bg-background/50 min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="aircraft"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm font-medium">
                            Aircraft
                          </FormLabel>
                          <Popover
                            open={isAircraftPopoverOpen}
                            onOpenChange={setIsAircraftPopoverOpen}
                          >
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={isAircraftPopoverOpen}
                                  className={cn(
                                    "w-full justify-between bg-background/50",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value || "Select aircraft"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-full p-0"
                              align="start"
                            >
                              <Command className="max-h-[300px]">
                                <CommandInput placeholder="Search aircraft..." />
                                <CommandList>
                                  <CommandEmpty>
                                    No aircraft found.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {AIRCRAFT_TYPES.map((aircraft) => (
                                      <CommandItem
                                        key={aircraft}
                                        value={aircraft}
                                        onSelect={(currentValue) => {
                                          form.setValue(
                                            "aircraft",
                                            currentValue
                                          );
                                          setIsAircraftPopoverOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value === aircraft
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {aircraft}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="bg-muted/30 backdrop-blur-sm rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">Texture IDs</h2>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ name: "", id: "" })}
                        className="bg-background/50 h-8"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="flex items-center space-x-2 bg-background/50 p-3 rounded-lg shadow-sm"
                        >
                          <FormField
                            control={form.control}
                            name={`textureIds.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input
                                    placeholder="Name"
                                    className="bg-background/80"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`textureIds.${index}.id`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input
                                    placeholder="ID"
                                    className="bg-background/80 font-mono"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => remove(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <FormDescription className="text-xs mt-2">
                        Add all texture IDs that are required for this livery
                      </FormDescription>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div className="bg-muted/30 backdrop-blur-sm rounded-lg p-6">
                    <FormField
                      control={form.control}
                      name="images"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between mb-4">
                            <FormLabel className="text-xl font-semibold mb-0">
                              Images
                            </FormLabel>
                            <span className="text-xs text-muted-foreground">
                              {imagePreview.length}/5 images
                            </span>
                          </div>
                          <FormControl>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              {imagePreview.map((preview, index) => (
                                <div
                                  key={index}
                                  className="relative rounded-lg overflow-hidden group aspect-[3/2] shadow-md border border-border/30"
                                >
                                  <Image
                                    src={preview.url}
                                    alt={`Preview ${index + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      className="h-8 w-8 rounded-full"
                                      onClick={() => handleRemoveImage(index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              {imagePreview.length < 5 && (
                                <label className="relative rounded-lg overflow-hidden bg-background/50 cursor-pointer hover:bg-background/70 transition-colors flex items-center justify-center aspect-[3/2] border border-dashed border-border">
                                  <Input
                                    type="file"
                                    multiple
                                    onChange={(e) =>
                                      handleImageChange(e, field.onChange)
                                    }
                                    accept={ACCEPTED_IMAGE_TYPES.join(",")}
                                    className="sr-only"
                                  />
                                  <div className="flex flex-col items-center justify-center p-4 text-center">
                                    <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                                    <span className="text-xs text-muted-foreground">
                                      {imagePreview.length === 0
                                        ? "Add images"
                                        : "Add more images"}
                                    </span>
                                    <span className="text-xs text-muted-foreground mt-1">
                                      JPEG, PNG, WebP (max 5MB)
                                    </span>
                                  </div>
                                </label>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="bg-muted/30 backdrop-blur-sm rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">
                        Advanced Configuration
                      </h2>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setShowAdvancedCustomization(
                            !showAdvancedCustomization
                          )
                        }
                        className="h-8"
                      >
                        <Code className="h-3 w-3 mr-1" />
                        {showAdvancedCustomization ? "Hide" : "Show"}
                      </Button>
                    </div>

                    {showAdvancedCustomization ? (
                      <FormField
                        control={form.control}
                        name="advancedCustomization"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="{ &#10;  // Enter JSON data here&#10;}"
                                className={cn(
                                  "font-mono text-sm bg-background/80",
                                  !isJsonValid &&
                                    "border-destructive focus:ring-destructive"
                                )}
                                rows={10}
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  validateJson(e.target.value);
                                }}
                              />
                            </FormControl>
                            <div className="flex justify-between mt-2">
                              <FormDescription className="text-xs">
                                Enter a valid JSON object for advanced
                                customization
                              </FormDescription>
                              {!isJsonValid && (
                                <p className="text-xs font-medium text-destructive">
                                  Invalid JSON format
                                </p>
                              )}
                            </div>
                          </FormItem>
                        )}
                      />
                    ) : (
                      <div className="bg-background/50 rounded-lg p-4 text-sm text-muted-foreground">
                        <p>
                          Advanced configuration allows you to set additional
                          parameters for your livery using JSON format.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t">
                <Button
                  type="submit"
                  className="w-full md:w-auto px-8"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-5 w-5" />
                      Upload Livery
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </Card>
    </div>
  );
}
