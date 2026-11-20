export type Phone = {
  id: string;
  name: string;
  short: string;
  description: string;
  image: string;
  price: number | null;
  inStock: boolean;
  available: number;
  imeis?: string[];
  reservedImeis?: string[];
};

export const defaultPhones: Phone[] = [
  {
    id: "row_cf3cee3ae60dca28f33d",
    name: "Samsung Galaxy A06",
    short: "Galaxy A06",
    description: "A 6.7-inch screen, a 50MP main camera and a 5,000mAh battery.",
    image: "/assets/phones/galaxy-a06.webp",
    price: null,
    inStock: false,
    available: 0,
  },
  {
    id: "row_b45453af20175237aca4",
    name: "Samsung Galaxy A50",
    short: "Galaxy A50",
    description: "A 6.4-inch Super AMOLED screen, a 25MP main camera and an in-screen fingerprint reader.",
    image: "/assets/phones/galaxy-a50.webp",
    price: null,
    inStock: false,
    available: 0,
  },
  {
    id: "row_77c52e7ee9bbbd0b7a19",
    name: "Tecno Spark Go 3",
    short: "Spark Go 3",
    description: "A 6.75-inch 120Hz screen, a 13MP rear camera and a 5,000mAh battery.",
    image: "/assets/phones/spark-go-3.webp",
    price: null,
    inStock: false,
    available: 0,
  },
];

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 0,
  }).format(price);
}
