import { Eye, Heart } from "lucide-react";
import Image from "next/image";

function Card({ title, img, tag, likes, views }) {
  return (
    <div className="w-full h-full">
      <div className="relative w-full h-[70%]">
        <Image className="object-cover rounded-xl" src={img} fill alt={title} />
      </div>

      <div className="flex my-2 opacity-60 justify-between">
        <div>{tag}</div>
        <div className="flex">
          <div className="flex items-center justify-self-end">
            <Heart className="h-2/3 fill-black" />
            <div>{likes}</div>
          </div>
          <div className="flex items-center px-2 justify-self-end">
            <Eye className="h-2/" />
            <div>{views}</div>
          </div>
        </div>
      </div>
      <div className="text-3xl text-ellipsis">{title}</div>
    </div>
  );
}

export default Card;
