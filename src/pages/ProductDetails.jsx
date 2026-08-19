import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Star,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  Plus,
  Minus,
  ArrowLeft,
  MessageSquare,
  Send,
  Sparkles,
  Layers,
} from "lucide-react";
import { listenToProduct } from "../services/productService";
import { listenToProductReviews, addReview } from "../services/reviewService";
import { normalizeImageUrl, KNOWN_COLORS } from "../services/cjDropshippingService";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";

export const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { currentUser, userProfile } = useAuth();
  const { showToast } = useToast();

  // === 1. BASIC STATE HOOKS ===
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // === 2. HELPER FUNCTIONS ===
  const safeStrMatch = (a, b) => {
    if (a === undefined || a === null || b === undefined || b === null)
      return false;
    const strA =
      typeof a === "object"
        ? a.name || a.size || a.color || JSON.stringify(a)
        : String(a);
    const strB =
      typeof b === "object"
        ? b.name || b.size || b.color || JSON.stringify(b)
        : String(b);
    return strA.trim().toLowerCase() === strB.trim().toLowerCase();
  };

  // === 3. DERIVED STATE HOOKS (useMemo & useCallback) ===
  const availableSizes = useMemo(() => {
    if (Array.isArray(product?.variants) && product.variants.length > 0) {
      const set = new Set();
      product.variants.forEach((v) => {
        const raw = typeof v === "object" && v !== null ? v.size || v.name : v;
        if (raw !== undefined && raw !== null) {
          const str = String(raw).trim();
          if (str) set.add(str);
        }
      });
      if (set.size > 0) return Array.from(set);
    }
    if (Array.isArray(product?.sizes) && product?.sizes.length > 0) {
      const set = new Set();
      product.sizes.forEach((s) => {
        const str =
          typeof s === "object" && s !== null
            ? s.size || s.name || JSON.stringify(s)
            : String(s || "");
        if (str.trim()) set.add(str.trim());
      });
      if (set.size > 0) return Array.from(set);
    }
    return [];
  }, [product?.variants, product?.sizes]);

  const availableColors = useMemo(() => {
    const set = new Set();
    if (Array.isArray(product?.colors) && product.colors.length > 0) {
      product.colors.forEach((c) => {
        const str =
          typeof c === "object" && c !== null
            ? c.color || c.name || JSON.stringify(c)
            : String(c || "");
        if (str.trim() && str.trim() !== "Default" && str.trim() !== "Standard") {
          set.add(str.trim());
        }
      });
    }
    if (Array.isArray(product?.variants) && product.variants.length > 0) {
      product.variants.forEach((v) => {
        const raw = typeof v === "object" && v !== null ? v.color || v.name : v;
        if (raw !== undefined && raw !== null) {
          const str = String(raw).trim();
          if (str && str !== "Default" && str !== "Standard") {
            set.add(str);
          }
        }
      });
    }
    return Array.from(set);
  }, [product?.variants, product?.colors]);

  const sizesForActiveColor = useMemo(() => {
    if (
      Array.isArray(product?.variants) &&
      product.variants.length > 0 &&
      selectedColor &&
      availableColors.length > 0
    ) {
      const set = new Set();
      product.variants.forEach((v) => {
        if (safeStrMatch(v.color, selectedColor)) {
          const raw =
            typeof v === "object" && v !== null ? v.size || v.name : v;
          if (raw !== undefined && raw !== null) {
            const str = String(raw).trim();
            if (str) set.add(str);
          }
        }
      });
      if (set.size > 0) return Array.from(set);
    }
    return availableSizes;
  }, [product?.variants, selectedColor, availableColors, availableSizes]);

  const activeVariant = useMemo(() => {
    if (!Array.isArray(product?.variants) || product.variants.length === 0)
      return null;
    const exact = product.variants.find(
      (v) =>
        safeStrMatch(v.size, selectedSize) &&
        safeStrMatch(v.color, selectedColor),
    );
    if (exact) return exact;
    const colorOnly = product.variants.find((v) =>
      safeStrMatch(v.color, selectedColor),
    );
    if (colorOnly) return colorOnly;
    const sizeOnly = product.variants.find((v) =>
      safeStrMatch(v.size, selectedSize),
    );
    return sizeOnly || null;
  }, [product?.variants, selectedSize, selectedColor]);

  const effectiveStock =
    activeVariant?.stock !== undefined
      ? activeVariant.stock
      : Number(product?.stock) || 0;

  const rawImages =
    Array.isArray(product?.images) && product?.images.length > 0
      ? product.images
      : [
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
        ];

  const productImages = rawImages.map(normalizeImageUrl).filter(Boolean);

  const imagesByColor = useMemo(() => {
    const map = new Map();
    if (Array.isArray(product?.variants)) {
      product.variants.forEach((v) => {
        const col = v.color;
        if (col && col !== "Default" && v.image) {
          const norm = normalizeImageUrl(v.image);
          if (!map.has(col)) map.set(col, new Set());
          map.get(col).add(norm);
        }
      });
    }
    return map;
  }, [product?.variants]);

  const findColorForImage = useCallback(
    (imgUrl, idx) => {
      if (!imgUrl) return null;
      const imgNorm = normalizeImageUrl(imgUrl);
      const imgLower = imgNorm.toLowerCase();
      const imgFilename = imgNorm.split("/").pop()?.split("?")[0] || "";

      // 1. Direct match in imagesByColor map
      for (const [col, imgSet] of imagesByColor.entries()) {
        for (const vImg of imgSet) {
          if (vImg === imgNorm) return col;
          const vFile = vImg.split("/").pop()?.split("?")[0];
          if (
            vFile &&
            imgFilename &&
            vFile.length > 4 &&
            (vFile === imgFilename ||
              vImg.includes(imgFilename) ||
              imgNorm.includes(vFile))
          ) {
            return col;
          }
        }
      }

      // 2. Direct match in product.variants
      if (Array.isArray(product?.variants)) {
        const match = product.variants.find((v) => {
          if (!v.image) return false;
          const vNorm = normalizeImageUrl(v.image);
          const vFile = vNorm.split("/").pop()?.split("?")[0];
          return (
            vNorm === imgNorm ||
            (imgFilename && imgFilename.length > 4 && vNorm.includes(imgFilename)) ||
            (vFile && vFile.length > 4 && imgNorm.includes(vFile))
          );
        });
        if (match?.color && match.color !== "Default" && match.color !== "Standard") {
          return match.color;
        }
      }

      // 3. Keyword matching against availableColors
      for (const col of availableColors) {
        if (col && col !== "Default" && col !== "Standard") {
          const colWords = col.toLowerCase().split(/\s+/);
          const colSlug = col.toLowerCase().replace(/\s+/g, "-");
          const colClean = col.toLowerCase().replace(/\s+/g, "");
          if (
            imgLower.includes(colSlug) || 
            imgLower.includes(colClean) ||
            colWords.some(w => w.length > 2 && imgLower.includes(w))
          ) {
            return col;
          }
        }
      }

      // 4. Fallback: Check KNOWN_COLORS in image URL
      for (const kc of (KNOWN_COLORS || [])) {
        const kcClean = kc.replace(/\s+/g, "");
        const kcSlug = kc.replace(/\s+/g, "-");
        if (imgLower.includes(kcClean) || imgLower.includes(kcSlug)) {
          const matched = availableColors.find(
            c => c.toLowerCase().includes(kc) || kc.includes(c.toLowerCase())
          );
          if (matched) return matched;
        }
      }

      return null;
    },
    [imagesByColor, availableColors, product?.variants],
  );

  const enrichedThumbnails = useMemo(() => {
    return productImages.map((img, idx) => ({
      url: img,
      matchedColor: findColorForImage(img, idx),
    }));
  }, [productImages, findColorForImage]);

  // === 4. LIFECYCLE HOOKS (useEffect) ===
  useEffect(() => {
    if (quantity > effectiveStock && effectiveStock > 0) {
      setQuantity(effectiveStock);
    } else if (effectiveStock <= 0 && quantity !== 1) {
      setQuantity(1);
    }
  }, [effectiveStock, quantity]);

  // 1. Listen to Firestore Product & Reviews (Only re-runs if product ID changes)
  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const unsubProduct = listenToProduct(
      id,
      (docData) => {
        if (docData) {
          setProduct(docData);
        } else {
          setError("Product was not found in Firestore.");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to product:", err);
        setError("Failed to load product details from Firestore.");
        setLoading(false);
      },
    );

    const unsubReviews = listenToProductReviews(
      id,
      (fetchedReviews) => {
        setReviews(Array.isArray(fetchedReviews) ? fetchedReviews : []);
      },
      (err) => {
        console.error("Error listening to reviews:", err);
      },
    );

    return () => {
      unsubProduct();
      unsubReviews();
    };
  }, [id]);

  // 2. Automatic & Resilient Variant Defaults Selection
  useEffect(() => {
    if (!product) return;

    // Set default Color if not selected or invalid
    if (availableColors.length > 0) {
      if (!selectedColor || !availableColors.some((c) => safeStrMatch(c, selectedColor))) {
        setSelectedColor(availableColors[0]);
      }
    }

    // Set default Size if not selected or invalid for current color
    const validSizes = sizesForActiveColor.length > 0 ? sizesForActiveColor : availableSizes;
    if (validSizes.length > 0) {
      if (!selectedSize || !validSizes.some((s) => safeStrMatch(s, selectedSize))) {
        setSelectedSize(validSizes[0]);
      }
    }
  }, [product, availableColors, sizesForActiveColor, availableSizes]);

  // === 5. EARLY RETURNS (Must be after ALL hooks) ===
  if (loading) {
    return (
      <LoadingSpinner
        fullPage
        message="Fetching live product from Firestore..."
      />
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorMessage
          title="Product Not Found"
          message={
            error ||
            "The requested item is not currently active in our Firestore catalog."
          }
          onRetry={() => navigate("/shop")}
        />
        <div className="text-center mt-4">
          <Link
            to="/shop"
            className="text-sm font-semibold text-slate-900 hover:underline"
          >
            ← Back to Store Catalog
          </Link>
        </div>
      </div>
    );
  }

  // === 6. RENDER DATA PREP ===
  const {
    name = "Apparel Item",
    description = "",
    price = 0,
    discountPrice = null,
    category = "streetwear",
    stock = 0,
    featured = false,
    isNewArrival = false,
    rating = 5,
    numReviews = 0,
  } = product;

  const basePrice = activeVariant?.price
    ? Number(activeVariant.price)
    : Number(price) || 0;
  const numDiscountPrice = discountPrice ? Number(discountPrice) : 0;
  const hasDiscount = Boolean(
    numDiscountPrice > 0 && numDiscountPrice < basePrice,
  );
  const activePrice = hasDiscount ? numDiscountPrice : basePrice;
  const discountPercent =
    hasDiscount && basePrice > 0
      ? Math.round(((basePrice - numDiscountPrice) / basePrice) * 100)
      : 0;

  const currentImage =
    productImages[selectedImageIndex] ||
    productImages[0] ||
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80";

  const isOutOfStock = effectiveStock <= 0;
  const variantSku = activeVariant?.sku || product?.cjpSku || null;

  // === 7. EVENT HANDLERS ===
  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(
      product,
      selectedSize || availableSizes[0],
      selectedColor || availableColors[0],
      quantity,
      activeVariant,
    );
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      showToast("Please provide a review comment.", "error");
      return;
    }

    try {
      setSubmittingReview(true);
      await addReview({
        productId: id,
        productName: name,
        userId: currentUser ? currentUser.uid : "guest",
        userName:
          reviewerName ||
          userProfile?.name ||
          currentUser?.displayName ||
          currentUser?.email?.split("@")[0] ||
          "Verified Customer",
        userEmail: currentUser?.email || "",
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      showToast("Review submitted successfully! Firestore updated.", "success");
      setReviewComment("");
      setReviewRating(5);
    } catch (err) {
      console.error("Failed to submit review:", err);
      showToast("Failed to submit review. Try again.", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatDisplayBadge = (rawText) => {
    if (!rawText) return "";
    let str = String(rawText).trim();
    if (/^(height|width)\s*=\s*(\d+)/i.test(str)) {
      const m = str.match(/^(height|width)\s*=\s*(\d+)/i);
      return `${m[2]}cm`;
    }
    str = str.replace(/^(height|width|size|color)\s*[:=]\s*/i, "");
    str = str.replace(/-/g, " ");
    return str.trim();
  };

  const handleThumbnailClick = (img, matchedColor, idx) => {
    setSelectedImageIndex(idx);

    const resolvedColor = matchedColor || findColorForImage(img, idx);

    if (resolvedColor) {
      setSelectedColor(resolvedColor);

      if (Array.isArray(product?.variants) && product.variants.length > 0) {
        const sizesInThisCol = product.variants
          .filter((v) => safeStrMatch(v.color, resolvedColor))
          .map((v) => String(v.size || ""));
        if (
          sizesInThisCol.length > 0 &&
          !sizesInThisCol.some((s) => safeStrMatch(s, selectedSize))
        ) {
          setSelectedSize(sizesInThisCol[0]);
        }
      }
    }
  };

  // === 8. COMPONENT RENDER ===
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link to="/" className="hover:text-slate-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-slate-900 transition-colors">
            Shop
          </Link>
          <span>/</span>
          <Link
            to={`/shop?category=${typeof category === "string" ? category : category?.slug || category?.name || "all"}`}
            className="hover:text-slate-900 transition-colors capitalize"
          >
            {typeof category === "string"
              ? category
              : category?.name || "Streetwear"}
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate max-w-[130px] sm:max-w-xs">
            {typeof name === "string" ? name : "Product"}
          </span>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-8 lg:p-10 border border-gray-100 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-gray-100 shadow-inner">
              <img
                src={currentImage}
                alt={typeof name === "string" ? name : "Product"}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80";
                }}
              />

              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {hasDiscount && (
                  <span className="px-3 py-1 text-xs font-extrabold bg-rose-600 text-white rounded-full shadow-md">
                    -{discountPercent}% OFF
                  </span>
                )}
                {featured && (
                  <span className="px-3 py-1 text-xs font-bold bg-amber-500 text-white rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Featured
                  </span>
                )}
              </div>

              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="px-4 py-2 bg-rose-600 text-white text-sm font-bold uppercase tracking-wider rounded-xl shadow-lg">
                    Currently Out of Stock
                  </span>
                </div>
              )}
            </div>

            {enrichedThumbnails.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {enrichedThumbnails.map(({ url, matchedColor }, idx) => {
                  const isColorActive =
                    matchedColor && safeStrMatch(matchedColor, selectedColor);
                  const isSelected =
                    selectedImageIndex === idx || isColorActive;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        handleThumbnailClick(url, matchedColor, idx)
                      }
                      title={
                        matchedColor
                          ? `Select ${matchedColor}`
                          : `View photo ${idx + 1}`
                      }
                      className={`w-20 h-24 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-slate-100 relative group ${
                        isSelected
                          ? "border-slate-950 shadow-md ring-2 ring-slate-950/20 scale-95 opacity-100"
                          : "border-transparent opacity-60 hover:opacity-100 hover:border-slate-300"
                      }`}
                    >
                      <img
                        src={url}
                        alt={
                          matchedColor
                            ? `Variant ${matchedColor}`
                            : `preview ${idx + 1}`
                        }
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80";
                        }}
                      />
                      {matchedColor && (
                        <span className="absolute bottom-1 inset-x-1 bg-black/75 backdrop-blur-[2px] text-white text-[9px] font-bold px-1 py-0.5 rounded text-center truncate pointer-events-none">
                          {formatDisplayBadge(matchedColor)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 bg-slate-100 text-slate-800 rounded-full">
                  {typeof category === "string"
                    ? category
                    : category?.name || "Streetwear"}
                </span>

                <div className="flex items-center gap-1 text-amber-500 font-semibold text-sm">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{Number(rating || 5).toFixed(1)}</span>
                  <span className="text-slate-400 font-normal text-xs">
                    ({reviews.length}{" "}
                    {reviews.length === 1 ? "review" : "reviews"})
                  </span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
                {typeof name === "string" ? name : "Apparel Item"}
              </h1>

              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-slate-950">
                  ${Number(activePrice || 0).toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-slate-400 line-through font-normal">
                    ${Number(basePrice || 0).toFixed(2)}
                  </span>
                )}
                {hasDiscount && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                    Save $
                    {(Number(basePrice) - Number(numDiscountPrice)).toFixed(2)}
                  </span>
                )}
              </div>

              {availableColors.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Color:{" "}
                    <span className="text-slate-600 font-normal">
                      {formatDisplayBadge(selectedColor)}
                    </span>
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {availableColors.map((col) => {
                      const displayColor = formatDisplayBadge(col);
                      const isSelected = safeStrMatch(selectedColor, col);

                      const lower = String(displayColor).toLowerCase();
                      const colorHex = lower.includes("white")
                        ? "#FFFFFF"
                        : lower.includes("black")
                          ? "#0F172A"
                          : lower.includes("rose red") || lower.includes("rose")
                            ? "#E11D48"
                            : lower.includes("red")
                              ? "#DC2626"
                              : lower.includes("sky blue")
                                ? "#38BDF8"
                                : lower.includes("navy")
                                  ? "#1E3A8A"
                                  : lower.includes("blue")
                                    ? "#2563EB"
                                    : lower.includes("pink")
                                      ? "#F472B6"
                                      : lower.includes("yellow")
                                        ? "#FACC15"
                                        : lower.includes("dark green")
                                          ? "#14532D"
                                          : lower.includes("green")
                                            ? "#16A34A"
                                            : lower.includes("khaki")
                                              ? "#C3B091"
                                              : lower.includes("apricot") ||
                                                  lower.includes("beige")
                                                ? "#FDE68A"
                                                : lower.includes("grey") ||
                                                    lower.includes("gray")
                                                  ? "#64748B"
                                                  : "#94A3B8";

                      const matchedVariant = Array.isArray(product.variants)
                        ? product.variants.find(
                            (v) =>
                              safeStrMatch(v.color, col) &&
                              (v.image || v.price),
                          )
                        : null;

                      const variantImg = matchedVariant?.image
                        ? normalizeImageUrl(matchedVariant.image)
                        : null;

                      let galleryIdx = -1;
                      if (variantImg && typeof variantImg === "string") {
                        galleryIdx = productImages.indexOf(variantImg);
                        if (galleryIdx === -1) {
                          const parts = variantImg.split("/");
                          const variantFilename =
                            parts[parts.length - 1]?.split("?")[0];
                          if (variantFilename && variantFilename.length > 3) {
                            galleryIdx = productImages.findIndex(
                              (img) =>
                                typeof img === "string" &&
                                img.includes(variantFilename),
                            );
                          }
                        }
                      }

                      return (
                        <button
                          key={col}
                          type="button"
                          onClick={() => {
                            setSelectedColor(col);
                            if (galleryIdx !== -1) {
                              setSelectedImageIndex(galleryIdx);
                            }
                            if (
                              Array.isArray(product?.variants) &&
                              product.variants.length > 0
                            ) {
                              const sizesInThisCol = product.variants
                                .filter((v) => safeStrMatch(v.color, col))
                                .map((v) => String(v.size || ""));
                              if (
                                sizesInThisCol.length > 0 &&
                                !sizesInThisCol.some((s) =>
                                  safeStrMatch(s, selectedSize),
                                )
                              ) {
                                setSelectedSize(sizesInThisCol[0]);
                              }
                            }
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                            isSelected
                              ? "bg-slate-950 border-slate-950 text-white shadow-md ring-2 ring-slate-900/20"
                              : "bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                          }`}
                        >
                          {variantImg ? (
                            <img
                              src={variantImg}
                              alt={displayColor}
                              referrerPolicy="no-referrer"
                              className="w-4 h-4 rounded-full object-cover border border-slate-300"
                            />
                          ) : (
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                              style={{ backgroundColor: colorHex }}
                            />
                          )}
                          <span>{displayColor}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {sizesForActiveColor.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Select Size:{" "}
                      <span className="text-slate-600 font-normal">
                        {formatDisplayBadge(selectedSize)}
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {sizesForActiveColor.map((s) => {
                      const displaySize = formatDisplayBadge(s);
                      return (
                        <button
                          key={s}
                          onClick={() => setSelectedSize(s)}
                          className={`min-w-[48px] h-11 px-4 rounded-xl text-xs font-bold transition-all border ${
                            safeStrMatch(selectedSize, s)
                              ? "bg-slate-950 border-slate-950 text-white shadow-md"
                              : "bg-white border-slate-200 text-slate-700 hover:border-slate-400"
                          }`}
                        >
                          {displaySize}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${effectiveStock > 0 ? "bg-emerald-500" : "bg-rose-500"}`}
                />
                <span className="text-xs font-semibold text-slate-700">
                  {effectiveStock > 0
                    ? `In Stock (${effectiveStock} available${activeVariant ? ` for ${selectedSize}/${selectedColor}` : ""})`
                    : "Out of Stock"}
                </span>
                {variantSku && (
                  <span className="text-[10px] text-slate-400 ml-1">
                    SKU: {variantSku}
                  </span>
                )}
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center justify-between sm:justify-center border border-slate-200 rounded-2xl p-1 bg-slate-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock || quantity <= 1}
                    className="p-2 text-slate-600 hover:text-slate-950 disabled:opacity-30 rounded-xl"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-slate-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(
                        Math.min(
                          Math.max(1, Number(effectiveStock) || 1),
                          quantity + 1,
                        ),
                      )
                    }
                    disabled={
                      isOutOfStock || quantity >= (Number(effectiveStock) || 1)
                    }
                    className="p-2 text-slate-600 hover:text-slate-950 disabled:opacity-30 rounded-xl"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="flex-1 w-full py-3.5 sm:py-4 bg-slate-950 hover:bg-black disabled:bg-slate-300 text-white text-sm font-bold rounded-2xl shadow-xl transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {isOutOfStock ? "Sold Out" : "Add to Shopping Bag"}
                  </span>
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <div className="flex flex-col items-center gap-1">
                <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-800">
                  Express Delivery
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RotateCcw className="w-5 h-5 text-slate-700" />
                <span className="text-[11px] font-semibold text-slate-800">
                  30-Day Returns
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-5 h-5 text-slate-700" />
                <span className="text-[11px] font-semibold text-slate-800">
                  100% Cotton
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2 space-y-2">
          {typeof description === "string" && description.trim() ? (
            description.includes("Overview:") ||
            description.includes("Product information:") ||
            description.includes("Note:") ? (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {description
                  .split(
                    /(Overview:|Product information:|Size:|Note:|Packing list:|Product Image:)/i,
                  )
                  .filter(Boolean)
                  .map((chunk, idx, arr) => {
                    const trimmed = chunk.trim();
                    if (
                      [
                        "Overview:",
                        "Product information:",
                        "Size:",
                        "Note:",
                        "Packing list:",
                        "Product Image:",
                      ].some((h) => h.toLowerCase() === trimmed.toLowerCase())
                    ) {
                      return (
                        <h5
                          key={idx}
                          className="font-bold text-slate-900 text-xs uppercase tracking-wider mt-2 first:mt-0"
                        >
                          {trimmed.replace(":", "")}
                        </h5>
                      );
                    }
                    return (
                      <p key={idx} className="text-slate-600 leading-relaxed">
                        {trimmed}
                      </p>
                    );
                  })}
              </div>
            ) : (
              <p>{description}</p>
            )
          ) : (
            <p>
              Crafted from premium selected materials with precision tailoring
              and high-durability stitching.
            </p>
          )}
        </div>
        <div className="mt-12 bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-950">
                Customer Reviews
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dynamic customer feedback from Firestore ({reviews.length}{" "}
                total)
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-extrabold text-slate-900">
                {rating || 5.0} out of 5
              </span>
            </div>
          </div>

          <form
            onSubmit={handleReviewSubmit}
            className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4"
          >
            <h4 className="text-sm font-bold text-slate-900">
              Write a Dynamic Review
            </h4>

            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-slate-700">
                Rating:
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setReviewRating(s)}
                    className="p-1 text-amber-400 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${s <= reviewRating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {!currentUser && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full sm:w-80 px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Review
              </label>
              <textarea
                rows="3"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your thoughts on the fit, fabric quality, and style..."
                required
                className="w-full px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={submittingReview}
              className="px-6 py-2.5 bg-slate-900 hover:bg-black disabled:bg-slate-400 text-white text-xs font-semibold rounded-xl shadow transition-all flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {submittingReview
                  ? "Submitting to Firestore..."
                  : "Submit Review"}
              </span>
            </button>
          </form>

          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No reviews yet for this product. Be the first to leave one!
              </div>
            ) : (
              reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-950 text-white flex items-center justify-center text-xs font-bold">
                        {rev.userName?.charAt(0) || "U"}
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        {rev.userName}
                      </span>
                    </div>

                    <div className="flex items-center text-amber-400">
                      {[1, 2, 3, 4, 5].map((st) => (
                        <Star
                          key={st}
                          className={`w-3.5 h-3.5 ${
                            st <= (rev.rating || 5)
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pl-9">
                    {rev.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
