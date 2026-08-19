import { collection, addDoc, getDocs, deleteDoc, serverTimestamp, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const INITIAL_CATEGORIES = [
  {
    name: "T-Shirts",
    slug: "t-shirts",
    description: "Premium heavy-weight and oversized streetwear graphic tees.",
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    name: "Hoodies & Sweats",
    slug: "hoodies-sweats",
    description: "Cozy french terry and fleece hoodies crafted for relaxed luxury.",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    name: "Jackets & Outerwear",
    slug: "jackets-outerwear",
    description: "Utility bombers, puffer jackets, and tailored denim layers.",
    image: "https://images.unsplash.com/photo-1544022613-e87ce7526edb?w=800&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    name: "Pants & Denim",
    slug: "pants-denim",
    description: "Cargo trousers, vintage straight denim, and relaxed sweatpants.",
    image: "https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    name: "Caps & Accessories",
    slug: "accessories",
    description: "Embroidered dad caps, canvas tote bags, and everyday essentials.",
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&auto=format&fit=crop&q=80",
    isActive: true
  }
];

export const INITIAL_PRODUCTS = [
  {
    name: "Ryanz Vintage Washed Oversized T-Shirt",
    description: "Heavyweight 260 GSM organic cotton t-shirt with a vintage acid wash finish and signature dropped shoulder fit.",
    price: 38,
    discountPrice: 30,
    category: "t-shirts",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Washed Black", "Vintage Olive", "Charcoal"],
    stock: 45,
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80"
    ],
    featured: true,
    isNewArrival: true,
    isActive: true,
    rating: 4.9,
    numReviews: 24
  },
  {
    name: "Heavy French Terry Boxy Hoodie",
    description: "500 GSM custom-milled French terry hoodie. Double-layered hood, seamless kangaroo pocket, and rib-knit cuffs.",
    price: 85,
    discountPrice: null,
    category: "hoodies-sweats",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Heather Grey", "Midnight Black", "Mocha Brown"],
    stock: 28,
    images: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80"
    ],
    featured: true,
    isNewArrival: false,
    isActive: true,
    rating: 4.8,
    numReviews: 18
  },
  {
    name: "Minimalist Utility Bomber Jacket",
    description: "Water-resistant satin nylon shell with clean matte black hardware and quilted interior insulation.",
    price: 120,
    discountPrice: 95,
    category: "jackets-outerwear",
    sizes: ["M", "L", "XL"],
    colors: ["Obsidian Black", "Army Sage"],
    stock: 15,
    images: [
      "https://images.unsplash.com/photo-1544022613-e87ce7526edb?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=800&auto=format&fit=crop&q=80"
    ],
    featured: true,
    isNewArrival: true,
    isActive: true,
    rating: 5.0,
    numReviews: 12
  },
  {
    name: "Relaxed Fit Cargo Work Pants",
    description: "Durable cotton twill trousers featuring deep expandable cargo compartments, drawstring hem adjusters, and reinforced stitching.",
    price: 72,
    discountPrice: 60,
    category: "pants-denim",
    sizes: ["30", "32", "34", "36"],
    colors: ["Desert Khaki", "Black", "Forest Green"],
    stock: 32,
    images: [
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop&q=80"
    ],
    featured: false,
    isNewArrival: true,
    isActive: true,
    rating: 4.7,
    numReviews: 15
  },
  {
    name: "Raw Selvedge Straight-Leg Denim",
    description: "14oz authentic Japanese selvedge denim. Crisp texture designed to age uniquely with your personal wear pattern.",
    price: 110,
    discountPrice: null,
    category: "pants-denim",
    sizes: ["30", "32", "34", "36"],
    colors: ["Indigo Selvedge"],
    stock: 20,
    images: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop&q=80"
    ],
    featured: true,
    isNewArrival: false,
    isActive: true,
    rating: 4.9,
    numReviews: 31
  },
  {
    name: "Ryanz Signature Embroidered Cap",
    description: "6-panel low profile cotton twill baseball cap with custom tonal metallic buckle clasp.",
    price: 28,
    discountPrice: 22,
    category: "accessories",
    sizes: ["One Size"],
    colors: ["Black", "Off-White", "Navy"],
    stock: 50,
    images: [
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&auto=format&fit=crop&q=80"
    ],
    featured: false,
    isNewArrival: true,
    isActive: true,
    rating: 4.6,
    numReviews: 8
  },
  {
    name: "Ryanz Acid Wash Graphic Tee",
    description: "Limited edition back graphic print inspired by modern brutalist architecture and underground sound culture.",
    price: 42,
    discountPrice: 35,
    category: "t-shirts",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Washed Charcoal", "Off-White"],
    stock: 19,
    images: [
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80"
    ],
    featured: true,
    isNewArrival: true,
    isActive: true,
    rating: 4.8,
    numReviews: 19
  },
  {
    name: "Heavyweight Fleece Zip-Up Hoodie",
    description: "Relaxed fit full-zip sweatshirt with two-way YKK metallic zipper and heavyweight ribbing.",
    price: 92,
    discountPrice: 78,
    category: "hoodies-sweats",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Black", "Dark Forest"],
    stock: 22,
    images: [
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80"
    ],
    featured: false,
    isNewArrival: true,
    isActive: true,
    rating: 4.9,
    numReviews: 14
  }
];

/**
 * Seed Firestore with initial categories, products, and sample reviews
 */
export const seedFirestoreDatabase = async () => {
  const results = {
    categoriesAdded: 0,
    productsAdded: 0,
    reviewsAdded: 0
  };

  try {
    // 1. Add Categories
    for (const cat of INITIAL_CATEGORIES) {
      await addDoc(collection(db, 'categories'), {
        ...cat,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      results.categoriesAdded++;
    }

    // 2. Add Products
    const createdProductIds = [];
    for (const prod of INITIAL_PRODUCTS) {
      const docRef = await addDoc(collection(db, 'products'), {
        ...prod,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      createdProductIds.push({ id: docRef.id, name: prod.name });
      results.productsAdded++;
    }

    // 3. Add Sample Reviews for first couple products
    if (createdProductIds.length > 0) {
      const sampleReviews = [
        {
          productId: createdProductIds[0].id,
          productName: createdProductIds[0].name,
          userId: "user_sample_1",
          userName: "Alex Rivera",
          userEmail: "alex@example.com",
          rating: 5,
          comment: "The cotton weight is incredible! Best oversized fit I have found this year.",
          createdAt: serverTimestamp()
        },
        {
          productId: createdProductIds[0].id,
          productName: createdProductIds[0].name,
          userId: "user_sample_2",
          userName: "Marcus Vance",
          userEmail: "marcus@example.com",
          rating: 5,
          comment: "Washed it twice already, no shrinkage and the color looks even better with wear.",
          createdAt: serverTimestamp()
        }
      ];

      for (const rev of sampleReviews) {
        await addDoc(collection(db, 'reviews'), rev);
        results.reviewsAdded++;
      }
    }

    return results;
  } catch (error) {
    console.error("Error seeding Firestore database:", error);
    throw error;
  }
};

/**
 * Delete all documents from products, categories, orders, and reviews collections
 */
export const clearFirestoreDatabase = async () => {
  const collectionsToClear = ['products', 'categories', 'orders', 'reviews'];
  const summary = {
    productsDeleted: 0,
    categoriesDeleted: 0,
    ordersDeleted: 0,
    reviewsDeleted: 0
  };

  try {
    for (const colName of collectionsToClear) {
      const snap = await getDocs(collection(db, colName));
      for (const docSnap of snap.docs) {
        await deleteDoc(doc(db, colName, docSnap.id));
        if (colName === 'products') summary.productsDeleted++;
        if (colName === 'categories') summary.categoriesDeleted++;
        if (colName === 'orders') summary.ordersDeleted++;
        if (colName === 'reviews') summary.reviewsDeleted++;
      }
    }
    return summary;
  } catch (error) {
    console.error("Error clearing Firestore database:", error);
    throw error;
  }
};
