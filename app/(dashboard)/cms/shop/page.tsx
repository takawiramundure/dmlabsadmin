"use client";


import { useState, useEffect } from "react";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { Modal } from "@/components/ui/modal";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import MediaLibrary from "@/components/common/MediaLibrary";
import { useDialog } from "@/context/DialogContext";
import {
    PencilIcon,
    TrashBinIcon,
    PlusIcon,
} from "@/icons";
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";
import { useDataTable } from "@/hooks/useDataTable";
import TablePagination from "@/components/ui/table/TablePagination";
import TableControls from "@/components/ui/table/TableControls";

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image: string;
    published: boolean;
    order: number;
    featured: boolean;
    type: 'physical' | 'digital';
    buyLink?: string;
    stock: number;
}

const TEST_PRODUCTS: Partial<Product>[] = [
    {
        name: "BWEIC Signature T-Shirt",
        description: "Premium cotton t-shirt featuring the BWEIC logo. Available in various sizes.",
        price: 35.00,
        category: "Apparel",
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800",
        published: true,
        order: 1,
        featured: true,
        type: "physical",
        stock: 50
    },
    {
        name: "Empowerment Journal",
        description: "A beautifully designed journal for your daily thoughts and goals.",
        price: 25.00,
        category: "Stationery",
        image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800",
        published: true,
        order: 2,
        featured: false,
        type: "physical",
        stock: 30
    },
    {
        name: "Financial Literacy E-Book",
        description: "A comprehensive guide to financial freedom.",
        price: 19.99,
        category: "Books",
        image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800",
        published: true,
        order: 3,
        featured: true,
        type: "digital",
        stock: 999
    }
];

export default function ProductManager() {
    const { currentSite } = useSite();
    const { confirm } = useDialog();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
    const [currentProductId, setCurrentProductId] = useState<string | null>(null);

    // Form Data
    const [formData, setFormData] = useState<Partial<Product>>({
        name: "",
        description: "",
        price: 0,
        category: "Apparel",
        image: "",
        published: true,
        order: 0,
        featured: false,
        type: "physical",
        buyLink: "",
        stock: 0,
    });

    const {
        currentData: paginatedProducts,
        totalItems,
        currentPage,
        totalPages,
        pageSize,
        setPageSize,
        nextPage,
        prevPage,
        searchQuery,
        setSearchQuery,
    } = useDataTable<Product>({
        data: products,
        searchKeys: ['name', 'description', 'category'],
        initialPageSize: 10
    });

    useEffect(() => {
        loadProducts();
    }, [currentSite.id]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const data = await FirestoreService.getProducts(currentSite.id);
            // Sort by order ascending
            const sorted = data.sort((a: any, b: any) => a.order - b.order);
            setProducts(sorted as Product[]);
        } catch (err) {
            console.error(err);
            setError("Failed to load products.");
        } finally {
            setLoading(false);
        }
    };

    const handleSeed = async () => {
        setSaving(true);
        try {
            for (const product of TEST_PRODUCTS) {
                await FirestoreService.saveProduct(currentSite.id, product);
            }
            setSuccessMsg("Test products added successfully!");
            loadProducts();
        } catch (err) {
            console.error(err);
            setError("Failed to seed products.");
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name) {
            setError("Product Name is required.");
            return;
        }

        setSaving(true);
        setError("");
        setSuccessMsg("");

        try {
            await FirestoreService.saveProduct(
                currentSite.id,
                formData,
                currentProductId || undefined
            );

            setSuccessMsg(currentProductId ? "Product updated successfully!" : "Product created successfully!");
            setIsModalOpen(false);
            loadProducts();
            resetForm();
        } catch (err) {
            console.error(err);
            setError("Failed to save product.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete Product",
            message: "Are you sure you want to delete this product? This action cannot be undone.",
            variant: "danger",
            confirmLabel: "Delete"
        });

        if (!isConfirmed) return;

        try {
            await FirestoreService.deleteProduct(currentSite.id, id);
            loadProducts();
        } catch (err) {
            console.error(err);
            setError("Failed to delete product.");
        }
    };

    const handleEdit = (product: Product) => {
        setFormData({ ...product });
        setCurrentProductId(product.id);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            price: 0,
            category: "Apparel",
            image: "",
            published: true,
            order: products.length + 1,
            featured: false,
            type: "physical",
            buyLink: "",
            stock: 0,
        });
        setCurrentProductId(null);
    };

    const openModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    return (
        <>
            <PageMeta
                title="Product Manager"
                description="Manage shop products and merchandise"
            />

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold dark:text-white">Product Manager</h1>
                <div className="flex gap-2">
                    <VersionHistoryManager documentId="shop" siteId={currentSite.id} />
                    <Button requireSuperAdmin onClick={handleSeed} variant="outline" disabled={saving || products.length > 0}>
                        {saving ? "Adding..." : "Seed Test Products"}
                    </Button>
                    <Button onClick={openModal} className="flex items-center gap-2">
                        <PlusIcon className="w-4 h-4" /> Add Product
                    </Button>
                </div>
            </div>

            {error && <Alert variant="error" title="Error" message={error} />}
            {successMsg && <Alert variant="success" title="Success" message={successMsg} />}

            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading products...</div>
            ) : (
                <>
                    <div className="bg-gray-50/50 dark:bg-white/[0.01] p-4 rounded-xl border border-gray-150 dark:border-gray-800 mb-6">
                        <TableControls
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            searchPlaceholder="Search products..."
                        />
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 font-medium">
                                    <th className="p-4">Image</th>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4">Price</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Order</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {paginatedProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-500">
                                            No products found
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                            <td className="p-4">
                                                {product.image ? (
                                                    <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded bg-gray-50" />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">No Img</div>
                                                )}
                                            </td>
                                            <td className="p-4 font-medium dark:text-white">
                                                {product.name}
                                                {product.featured && <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] rounded uppercase font-bold">Featured</span>}
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">{product.category}</td>
                                            <td className="p-4 text-sm font-bold">${product.price.toFixed(2)}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                                    {product.published ? "Published" : "Draft"}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-500">{product.order}</td>
                                            <td className="p-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="text-gray-400 hover:text-blue-500 transition-colors"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <TrashBinIcon className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="mt-6">
                    <TablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        pageSize={pageSize}
                        setPageSize={setPageSize}
                        nextPage={nextPage}
                        prevPage={prevPage}
                    />
                </div>
            </>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentProductId ? "Edit Product" : "Add New Product"}
                size="lg"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Label>Product Name</Label>
                            <Input
                                placeholder="Enter product name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label>Category</Label>
                            <select
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="Apparel">Apparel</option>
                                <option value="Accessories">Accessories</option>
                                <option value="Stationery">Stationery</option>
                                <option value="Books">Books</option>
                                <option value="Digital">Digital</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <Label>Price ($)</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                            />
                        </div>

                        <div>
                            <Label>Stock</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={formData.stock || 0}
                                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        <div className="col-span-2">
                            <Label>Product Image</Label>
                            <div className="flex gap-4 items-start">
                                {formData.image ? (
                                    <div className="relative group w-20 flex-shrink-0">
                                        <img
                                            src={formData.image}
                                            alt="Product"
                                            className="w-full h-20 object-cover rounded-lg border dark:border-gray-600 bg-gray-50"
                                        />
                                        <button
                                            onClick={() => setFormData({ ...formData, image: "" })}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
                                        >
                                            <TrashBinIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => setIsMediaLibraryOpen(true)}
                                        className="w-20 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 cursor-pointer transition-colors"
                                    >
                                        <span className="text-xs">Image</span>
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 mb-2">
                                        Select product image.
                                    </p>
                                    <Input
                                        placeholder="Or paste image URL"
                                        value={formData.image}
                                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2">
                            <Label>Description</Label>
                            <textarea
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                rows={3}
                                placeholder="Product description..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2">
                            <Label>External Buy Link (Optional)</Label>
                            <p className="text-xs text-gray-500 mb-1">
                                If using an external payment link (e.g. Stripe Payment Link, Square Checkout), paste it here.
                            </p>
                            <Input
                                placeholder="https://buy.stripe.com/..."
                                value={formData.buyLink}
                                onChange={(e) => setFormData({ ...formData, buyLink: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label>Sort Order</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={formData.order}
                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        <div className="flex flex-col gap-2 mt-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.published}
                                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium dark:text-gray-300">Published</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.featured}
                                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium dark:text-gray-300">Featured Product</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t dark:border-gray-700">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : currentProductId ? "Update Product" : "Create Product"}
                        </Button>
                    </div>
                </div>
            </Modal>

            <MediaLibrary
                isOpen={isMediaLibraryOpen}
                onClose={() => setIsMediaLibraryOpen(false)}
                onSelect={(url) => {
                    setFormData({ ...formData, image: url });
                    setIsMediaLibraryOpen(false);
                }}
            />
        </>
    );
}
