import Image from "next/image";

type CatalogImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
};

export function CatalogImage({ src, alt, width, height, className, priority }: CatalogImageProps) {
  if (src.startsWith("data:") || src.endsWith(".svg")) {
    return <img src={src} alt={alt} width={width} height={height} className={className} />;
  }
  return <Image src={src} alt={alt} width={width} height={height} className={className} priority={priority} />;
}
