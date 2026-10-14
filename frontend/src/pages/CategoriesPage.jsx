import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MarketplaceNavbar } from "../components/marketplace/MarketplaceNavbar";
import { MarketplaceFooter } from "../components/marketplace/MarketplaceFooter";
import { Icon, SmartImage } from "../components/marketplace/marketplaceUi";
import { categories } from "../data/marketplaceData";
import { getCategoryVisual } from "../data/homeContent";
import { Pagination } from "../components/ui/Pagination";
import { useSearchParams } from "react-router-dom";

const PER_PAGE = 12;
export function CategoriesPage() {


const [params, setParams] = useSearchParams();
const totalPages = Math.max(1, Math.ceil(categories.length / PER_PAGE));
const page = Math.min(totalPages, Math.max(1, Number.parseInt(params.get("page"), 10) || 1));
const visible = categories.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  useEffect(() => { document.title = "Categories | Marketplace"; }, []);

  return (
    <div className="min-h-screen bg-[#FBFAF7] font-sans">
      <MarketplaceNavbar />
      <main className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 py-10">
        <nav aria-label="Breadcrumb" className="text-xs text-[#6B6B6B] mb-4 flex items-center gap-1.5">
          <Link to="/" className="hover:text-[#111111]">Home</Link>
          <span aria-hidden="true">›</span>
          <span className="text-[#111111]">Categories</span>
        </nav>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#111111]">All Categories</h1>
        <p className="text-sm text-[#6B6B6B] mt-1 mb-8">Explore collections for every part of your life.</p>

              {categories.length === 0 ? (
          <p className="text-sm text-[#6B6B6B]">
            No categories are available yet.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
              {visible.map((cat) => {
                const visual = getCategoryVisual(cat.name);

                return (
                  <Link
                    key={cat.id}
                    to={`/products?category=${encodeURIComponent(cat.id)}`}
                    className="group block rounded-2xl border border-[#E8E5DF] bg-white overflow-hidden hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]/40"
                  >
                    <div className={`relative aspect-[4/3] ${visual.tint}`}>
                      <SmartImage
                        src={visual.image}
                        alt={cat.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        fallback={
                          <div className="absolute inset-0 flex items-center justify-center text-[#8A8578]">
                            <Icon name={visual.icon} size={40} strokeWidth={1.3} />
                          </div>
                        }
                      />
                    </div>

                    <div className="p-4 flex items-center justify-between">
                      <p className="text-sm font-medium text-[#111111]">
                        {cat.name}
                      </p>
                      <Icon
                        name="arrowRight"
                        size={15}
                        className="text-[#9A968D] group-hover:text-[#111111] transition-colors"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>

            {categories.length > PER_PAGE && (
              <div className="mt-10">
                <Pagination
                  page={page}
                  pages={totalPages}
                  total={categories.length}
                  limit={PER_PAGE}
                  onChange={(next) =>
                    setParams(next === 1 ? {} : { page: String(next) })
                  }
                />
              </div>
            )}
          </>
        )}
      </main>
      <MarketplaceFooter />
    </div>
  );
}