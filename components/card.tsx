import { Download, Heart } from "lucide-react";
import Image from "next/image";

function Card({ title, img, tag, likes, views }) {
  return (
    <div className="w-full bg-white rounded-xl shadow-md">
      <div className="relative w-full aspect-[16/9]">
        <Image className="object-cover rounded-xl" src={img} fill alt={title} />
      </div>

      <div className="flex mx-4 my-2 opacity-60 justify-between">
        <div className="">{tag}</div>
        <div className="flex">
          <div className="flex items-center justify-self-end">
            <Heart className="h-2/3" fill="red" strokeWidth={0} />
            <div>{likes}</div>
          </div>
          <div className="flex items-center px-2 justify-self-end">
            <Download className="h-2/3" />
            <div>{views}</div>
          </div>
        </div>
      </div>
      <div className="mx-4 text-xl text-ellipsis mb-4">{title}</div>
    </div>
  );
}

export default Card;
