import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Bookmark, Star, User } from 'lucide-react'

interface Livery {
  id: number
  name: string
  creator: string
  saved: number
  rating: number
  image: string
  isSaved: boolean
}

interface LiveryCardProps {
  livery: Livery
  onToggleSave: (id: number) => void
}

export function LiveryCard({ livery, onToggleSave }: LiveryCardProps) {
  return (
    <Card className="overflow-hidden">
      <Image
        src={livery.image}
        alt={livery.name}
        width={600}
        height={400}
        className="w-full h-48 object-cover"
      />
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg line-clamp-2">{livery.name}</h3>
        <p className="text-sm text-muted-foreground mt-1 flex items-center">
          <User className="h-4 w-4 mr-1" />
          {livery.creator}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => onToggleSave(livery.id)}
            variant="ghost"
            size="sm"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors p-0"
          >
            <Bookmark
              className={`h-4 w-4 mr-1 ${livery.isSaved ? 'fill-current text-foreground' : ''}`}
            />
            {livery.saved}
          </Button>
          <span className="text-sm text-muted-foreground flex items-center">
            <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
            {livery.rating.toFixed(1)}
          </span>
        </div>
        <Button size="sm" variant="outline">View Details</Button>
      </CardFooter>
    </Card>
  )
}