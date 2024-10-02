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

const AIRCRAFT_TYPES = [
  "Airbus A220",
  "Airbus A320",
  "Boeing 737",
  "Boeing 757",
];

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
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [showAdvancedCustomization, setShowAdvancedCustomization] =
    useState(false);
  const [isAircraftPopoverOpen, setIsAircraftPopoverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    setIsSubmitting(true);

    try {
      // Upload images to Supabase storage
      const imageUrls = await Promise.all(
        values.images.map(async (file) => {
          const fileName = `${user.id}/${Date.now()}-${file.name}`;
          const { data, error } = await supabase.storage
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
        aircraft: values.aircraft,
        images: imageUrls,
        likes: 0,
        views: 0,
        advanced_customization: values.advancedCustomization
          ? JSON.parse(values.advancedCustomization)
          : null,
        texture_ids: values.textureIds,
      };

      // Insert data into Supabase
      const { data, error } = await supabase
        .from("liveries")
        .insert([liveryData])
        .select();

      if (error) throw error;

      toast({
        title: "Livery uploaded successfully!",
        description: "Your livery has been submitted for review.",
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
    const validFiles = files.filter(
      (file) =>
        file.size <= MAX_FILE_SIZE && ACCEPTED_IMAGE_TYPES.includes(file.type)
    );

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid file(s) detected",
        description:
          "Some files were skipped due to size or format restrictions.",
        variant: "destructive",
        duration: 5000,
      });
    }

    onChange(validFiles);
    setImagePreview((prev) => [
      ...prev,
      ...validFiles.map((file) => URL.createObjectURL(file)),
    ]);
  };

  return (
    <div className="max-w-4xl px-4 sm:px-6 lg:px-8 mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8 text-center">Upload Livery</h1>
      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter livery title" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter livery description"
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
                  <FormLabel>Aircraft</FormLabel>
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
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value || "Select aircraft"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search aircraft..." />
                        <CommandList>
                          <CommandEmpty>No aircraft found.</CommandEmpty>
                          <CommandGroup>
                            {AIRCRAFT_TYPES.map((aircraft) => (
                              <CommandItem
                                key={aircraft}
                                value={aircraft}
                                onSelect={(currentValue) => {
                                  form.setValue("aircraft", currentValue);
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

            <div>
              <FormLabel>Texture IDs</FormLabel>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-center space-x-2 bg-secondary/50 p-2 rounded-md"
                  >
                    <FormField
                      control={form.control}
                      name={`textureIds.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Name" {...field} />
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
                            <Input placeholder="ID" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ name: "", id: "" })}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Texture ID
              </Button>
            </div>

            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Images</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-3 gap-4">
                      {imagePreview.map((src, index) => (
                        <div
                          key={index}
                          className="aspect-w-3 aspect-h-2 relative rounded-md overflow-hidden"
                        >
                          <Image
                            src={src}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                      <label className="aspect-w-3 aspect-h-2 relative rounded-md overflow-hidden bg-secondary/50 cursor-pointer hover:bg-secondary/70 transition-colors">
                        <Input
                          type="file"
                          multiple
                          onChange={(e) => handleImageChange(e, field.onChange)}
                          accept={ACCEPTED_IMAGE_TYPES.join(",")}
                          className="sr-only"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Plus className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </label>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload at least one image of your livery (max 5 images, 5MB
                    each, .jpg, .png, or .webp)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setShowAdvancedCustomization(!showAdvancedCustomization)
                }
                className="mb-2"
              >
                <Code className="h-4 w-4 mr-2" />
                {showAdvancedCustomization ? "Hide" : "Show"} Advanced
                Customization
              </Button>
              {showAdvancedCustomization && (
                <FormField
                  control={form.control}
                  name="advancedCustomization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Advanced Customization (JSON)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter JSON for advanced customization"
                          className="font-mono"
                          rows={10}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter a valid JSON object for advanced customization
                        options
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Livery
                </>
              )}
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}
