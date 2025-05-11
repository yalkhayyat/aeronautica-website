"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Livery } from "@/components/livery_card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from "@/lib/supabase-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import AIRCRAFT_TYPES from "@/data/aircraft-types.json";
import { Loader2, Plus, X, Upload, Image as ImageIcon } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EditLiveryModalProps {
  livery: Livery;
  isOpen: boolean;
  onClose: () => void;
  onSave: (livery: Livery) => void;
}

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
  advancedCustomization: z.string().optional(),
  images: z
    .array(
      z.custom<File>((val) => {
        // Check if it's a URL string (existing image) or a File (new upload)
        if (typeof val === "string") return true;

        // Validate new file uploads
        if (!(val instanceof File)) return false;
        if (val.size > MAX_FILE_SIZE) return false;
        if (!ACCEPTED_IMAGE_TYPES.includes(val.type)) return false;

        return true;
      }, "Please upload a valid image file under 5MB (jpg, png, webp)")
    )
    .min(1, "At least one image is required")
    .max(5, "Maximum 5 images allowed"),
});

type FormValues = z.infer<typeof formSchema>;

export function EditLiveryModal({
  livery,
  isOpen,
  onClose,
  onSave,
}: EditLiveryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const supabase = useSupabase();
  const { user } = useUser();
  const [imagePreview, setImagePreview] = useState<
    Array<{ url: string; file: File | string }>
  >([]);
  const [showAdvancedCustomization, setShowAdvancedCustomization] =
    useState(false);
  const [isJsonValid, setIsJsonValid] = useState(true);
  const [currentTab, setCurrentTab] = useState<string>("basic");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: livery.title,
      description: livery.description || "",
      aircraft: livery.vehicle_name,
      textureIds: livery.texture_ids || [{ name: "", id: "" }],
      advancedCustomization: livery.advanced_customization
        ? JSON.stringify(livery.advanced_customization, null, 2)
        : "",
      images: livery.images || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "textureIds",
  });

  // Initialize image previews from existing livery images
  useEffect(() => {
    if (livery.images && livery.images.length > 0) {
      setImagePreview(livery.images.map((url) => ({ url, file: url })));
    }
  }, [livery.images]);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);

    // Check if adding new files would exceed the 5 image limit
    const currentImages = form.getValues("images");
    if (currentImages.length + files.length > 5) {
      toast({
        title: "Error",
        description: `You can only upload a maximum of 5 images. You already have ${currentImages.length} images.`,
        variant: "destructive",
      });
      return;
    }

    // Create preview URLs and add files to form
    files.forEach((file) => {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Error",
          description: `File ${file.name} exceeds the 5MB size limit.`,
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast({
          title: "Error",
          description: `File ${file.name} has an unsupported format. Only JPG, PNG, and WebP are supported.`,
          variant: "destructive",
        });
        return;
      }

      const url = URL.createObjectURL(file);
      setImagePreview((prev) => [...prev, { url, file }]);
      form.setValue("images", [...form.getValues("images"), file]);
    });
  };

  const removeImage = (index: number) => {
    const currentPreviews = [...imagePreview];
    const currentImages = [...form.getValues("images")];

    // Release the object URL to avoid memory leaks
    if (typeof currentPreviews[index].file !== "string") {
      URL.revokeObjectURL(currentPreviews[index].url);
    }

    // Remove from previews and form state
    currentPreviews.splice(index, 1);
    currentImages.splice(index, 1);

    setImagePreview(currentPreviews);
    form.setValue("images", currentImages);
  };

  const handleSubmit = async (values: FormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update a livery.",
        variant: "destructive",
      });
      return;
    }

    if (!validateJson(values.advancedCustomization || "")) {
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrls = [...values.images];

      // Upload new images if there are any file objects
      const newImageFiles = values.images.filter(
        (image) => image instanceof File
      ) as File[];

      if (newImageFiles.length > 0) {
        const newUrls = await Promise.all(
          newImageFiles.map(async (file) => {
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

        // Replace File objects with URLs in the image array
        imageUrls = values.images.map((image) => {
          if (image instanceof File) {
            // Find the uploaded URL for this file
            const index = newImageFiles.findIndex((f) => f === image);
            return newUrls[index];
          }
          return image as string;
        });
      }

      // Update livery in the database
      const { data, error } = await supabase
        .from("liveries")
        .update({
          title: values.title,
          description: values.description || null,
          vehicle_name: values.aircraft,
          vehicle_type: values.aircraft, // For consistency with the database schema
          texture_ids: values.textureIds,
          advanced_customization: values.advancedCustomization
            ? JSON.parse(values.advancedCustomization)
            : null,
          images: imageUrls,
          updated_at: new Date().toISOString(),
        })
        .eq("id", livery.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Livery updated successfully",
      });

      // Call the onSave callback with the updated livery
      onSave({
        ...livery,
        ...data,
      });
    } catch (error) {
      console.error("Error updating livery:", error);
      toast({
        title: "Error",
        description: "Failed to update livery",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Livery</DialogTitle>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="mt-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="texture">Texture IDs</TabsTrigger>
            <TabsTrigger value="advanced">Images & Advanced</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6 mt-4"
            >
              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                          {...field}
                          value={field.value || ""}
                          placeholder="Describe your livery (optional)"
                          className="min-h-[100px]"
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
                    <FormItem>
                      <FormLabel>Aircraft</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select aircraft" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AIRCRAFT_TYPES.map((aircraft) => (
                            <SelectItem key={aircraft} value={aircraft}>
                              {aircraft}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="texture" className="space-y-4">
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

                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-[1fr,1fr,auto] gap-3 mb-3 items-start"
                    >
                      <FormField
                        control={form.control}
                        name={`textureIds.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={cn(index !== 0 && "sr-only")}>
                              Name
                            </FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Fuselage" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`textureIds.${index}.id`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={cn(index !== 0 && "sr-only")}>
                              ID
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="e.g., a320_fuselage"
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
                          className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive mt-8"
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
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <FormItem>
                  <FormLabel>Images</FormLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {imagePreview.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="relative aspect-video rounded-md overflow-hidden border">
                          <Image
                            src={image.url}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {imagePreview.length < 5 && (
                      <div className="flex items-center justify-center border border-dashed rounded-md aspect-video">
                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Add Image
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept=".jpg,.jpeg,.png,.webp"
                            onChange={handleImageUpload}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel
                      htmlFor="advanced-customization"
                      className="text-base"
                    >
                      Advanced Customization
                    </FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setShowAdvancedCustomization(!showAdvancedCustomization)
                      }
                    >
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
                              id="advanced-customization"
                              placeholder='{ "key": "value" }'
                              className={cn(
                                "font-mono h-[200px]",
                                !isJsonValid && "border-destructive"
                              )}
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                validateJson(e.target.value);
                              }}
                            />
                          </FormControl>
                          {!isJsonValid && (
                            <p className="text-sm text-destructive mt-2">
                              Invalid JSON format
                            </p>
                          )}
                          <FormDescription>
                            Advanced customization in JSON format
                          </FormDescription>
                          <FormMessage />
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
              </TabsContent>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
