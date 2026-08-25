"use client";

import { useState, useEffect } from "react";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import { PlusIcon, TrashBinIcon, CalenderIcon, PencilIcon, FolderIcon } from "@/icons";
import MediaPickerModal from "@/components/common/MediaPickerModal";
import { FilePicker } from "@/components/form/FilePicker";
import MediaLibrary from "@/components/common/MediaLibrary";
import { Modal } from "@/components/ui/modal";
import RichTextEditor from "@/components/form/RichTextEditor";
import { useDialog } from "@/context/DialogContext";
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";

interface Article {
    id: string;
    title: string;
    slug: string;
    author: string;
    date: any;
    category: string;
    imageUrl: string;
    excerpt: string;
    content: string;
    published: boolean;
}

export default function NewslettersManager() {
    const { currentSite } = useSite();
    const { confirm, alert: dialogAlert } = useDialog();
    const [activeTab, setActiveTab] = useState<'pdfs' | 'news'>('pdfs');
    
    // PDF Newsletters State
    const [newsletters, setNewsletters] = useState<any[]>([]);
    const [loadingPdfs, setLoadingPdfs] = useState(true);
    const [savingPdfs, setSavingPdfs] = useState(false);
    
    // News Articles State
    const [articles, setArticles] = useState<Article[]>([]);
    const [loadingNews, setLoadingNews] = useState(true);
    const [savingNews, setSavingNews] = useState(false);
    const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
    const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
    const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
    const [articleFormData, setArticleFormData] = useState<Partial<Article>>({
        title: "", author: "", category: "News", imageUrl: "", excerpt: "", content: "", published: true, date: new Date()
    });

    // General UI State
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    useEffect(() => {
        const siteId = currentSite?.id;
        if (siteId) {
            loadPdfs(siteId);
            loadNews(siteId);
        }
    }, [currentSite?.id]);

    const loadPdfs = async (siteId: string) => {
        setLoadingPdfs(true);
        try {
            const data: any = await FirestoreService.getPageContent("newsletters", siteId);
            setNewsletters(data?.items || []);
        } catch (error) {
            console.error("Error loading newsletters:", error);
        } finally {
            setLoadingPdfs(false);
        }
    };

    const loadNews = async (siteId: string) => {
        setLoadingNews(true);
        try {
            const data = await FirestoreService.getArticles(siteId);
            const sorted = data.sort((a: any, b: any) => {
                const dateA = a.date?.seconds ? new Date(a.date.seconds * 1000) : new Date(a.date || 0);
                const dateB = b.date?.seconds ? new Date(b.date.seconds * 1000) : new Date(b.date || 0);
                return dateB.getTime() - dateA.getTime();
            });
            setArticles(sorted as Article[]);
        } catch (error) {
            console.error("Error loading news:", error);
        } finally {
            setLoadingNews(false);
        }
    };

    const handleSavePdfs = async () => {
        setSavingPdfs(true);
        setError("");
        setSuccessMsg("");
        try {
            await FirestoreService.savePageContent("newsletters", { items: newsletters }, currentSite.id);
            setSuccessMsg("Newsletters saved successfully!");
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (error) {
            setError("Failed to save newsletters.");
        } finally {
            setSavingPdfs(false);
        }
    };

    const addNewsletter = () => {
        setNewsletters([{
            id: Date.now().toString(),
            title: "New Newsletter",
            pdfUrl: "",
            date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            isActive: true
        }, ...newsletters]);
    };

    const updateNewsletter = (index: number, field: string, value: any) => {
        const newNewsletters = [...newsletters];
        newNewsletters[index] = { ...newNewsletters[index], [field]: value };
        setNewsletters(newNewsletters);
    };

    const deleteNewsletter = async (index: number) => {
        const isConfirmed = await confirm({
            title: "Delete Newsletter",
            message: "Are you sure you want to delete this newsletter? This cannot be undone.",
            variant: "danger",
            confirmLabel: "Delete"
        });

        if (isConfirmed) {
            setNewsletters(newsletters.filter((_, i) => i !== index));
        }
    };

    // Article Logic
    const formatDateForInput = (date: any) => {
        if (!date) return "";
        const d = date.toDate ? date.toDate() : new Date(date);
        if (isNaN(d.getTime())) return "";
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const openNewArticleModal = () => {
        setCurrentArticleId(null);
        setArticleFormData({ title: "", author: "", category: "News", imageUrl: "", excerpt: "", content: "", published: true, date: new Date() });
        setIsArticleModalOpen(true);
    };

    const openEditArticleModal = (article: Article) => {
        setCurrentArticleId(article.id);
        const dateObj = article.date?.toDate ? article.date.toDate() : new Date(article.date || Date.now());
        setArticleFormData({ ...article, date: dateObj });
        setIsArticleModalOpen(true);
    };

    const handleSaveArticle = async () => {
        if (!articleFormData.title || !articleFormData.author) {
            setError("Title and Author are required.");
            return;
        }
        setSavingNews(true);
        try {
            const slug = articleFormData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const data = { ...articleFormData, slug, date: articleFormData.date instanceof Date ? articleFormData.date : new Date(articleFormData.date as any) };
            await FirestoreService.saveArticle(currentSite.id, data, currentArticleId || undefined);
            setSuccessMsg("Article saved!");
            setIsArticleModalOpen(false);
            loadNews(currentSite.id);
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err) {
            setError("Failed to save article.");
        } finally {
            setSavingNews(false);
        }
    };

    const handleDeleteArticle = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete News Article",
            message: "Are you sure you want to delete this news item? This action cannot be undone.",
            variant: "danger",
            confirmLabel: "Delete"
        });

        if (!isConfirmed) return;
        try {
            await FirestoreService.deleteArticle(currentSite.id, id);
            setArticles(articles.filter(a => a.id !== id));
        } catch (err) {
            setError("Failed to delete article.");
        }
    };

    const seedNews = async () => {
        const isConfirmed = await confirm({
            title: "Seed News Articles",
            message: "This will add the authentic Recent News items. Continue?",
            variant: "warning",
            confirmLabel: "Seed News"
        });

        if (!isConfirmed) return;
        const fallbackArticles = [
            {
                title: "KMFW Featured on The Observer News",
                excerpt: "Kind Minds Family Wellness is grateful to The Observer news outlet for this feature highlighting our new programs aiming to teach local Black youth business.",
                imageUrl: "https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
                category: "Observer News",
                author: "The Observer",
                date: new Date("2024-02-01"),
                published: true,
                content: "Kind Minds Family Wellness is grateful to The Observer news outlet for this feature highlighting our new programs aiming to teach local Black youth business."
            },
            {
                title: "KWCF Racial Equity Fund Feature",
                excerpt: "Catch our feature on CBC News discussing the critical impact of the KWCF Racial Equity Fund.",
                imageUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
                category: "CBC News",
                author: "CBC",
                date: new Date("2024-01-01"),
                published: true,
                content: "Catch our feature on CBC News discussing the critical impact of the KWCF Racial Equity Fund."
            }
        ];
        
        setSavingNews(true);
        try {
            for (const item of fallbackArticles) {
                const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                await FirestoreService.saveArticle(currentSite.id, { ...item, slug });
            }
            loadNews(currentSite.id);
            setSuccessMsg("News items seeded!");
        } catch (err) {
            setError("Seeding failed.");
        } finally {
            setSavingNews(false);
        }
    };

    if (loadingPdfs || loadingNews) return <div className="p-6 text-center">Loading Content...</div>;

    return (
        <>
            <PageMeta title="News & Newsletters | Admin" description="Manage PDFs and News Articles" />

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                
                {/* Unified Header */}
                <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Media & Newsletters</h2>
                        <p className="text-sm text-gray-500">Manage both PDF publications and recent news features.</p>
                    </div>
                </div>

                {/* Tabs Selection */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8 overflow-x-auto no-scrollbar">
                    <VersionHistoryManager documentId="newsletters" siteId={currentSite.id} />
                    <button 
                        onClick={() => setActiveTab('pdfs')}
                        className={`pb-4 px-6 font-semibold transition-colors border-b-2 ${activeTab === 'pdfs' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Newsletter PDFs
                    </button>
                    <button 
                        onClick={() => setActiveTab('news')}
                        className={`pb-4 px-6 font-semibold transition-colors border-b-2 ${activeTab === 'news' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Recent News & Features
                    </button>
                </div>

                {error && <div className="mb-4"><Alert variant="error" title="Error" message={error} /></div>}
                {successMsg && <div className="mb-4"><Alert variant="success" title="Success" message={successMsg} /></div>}

                {/* Tab 1: PDFs */}
                {activeTab === 'pdfs' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-700 dark:text-gray-200">Quarterly PDF Releases</h3>
                            <div className="flex gap-3">
                                <Button requireSuperAdmin variant="outline" onClick={async () => {
                                    const isConfirmed = await confirm({
                                        title: "Seed Newsletters",
                                        message: "Seed authentic KMFW newsletters? This will add them to your current list.",
                                        variant: "warning",
                                        confirmLabel: "Seed PDFs"
                                    });

                                    if (!isConfirmed) return;
                                    const samples = [
                                        { id: 's1', title: "Summer Newsletter 2024", pdfUrl: "/newsletters/Summer-2024.pdf", date: "Summer 2024", isActive: true },
                                        { id: 's2', title: "Fall Newsletter 2024", pdfUrl: "/newsletters/Fall-2024.pdf", date: "Fall 2024", isActive: true },
                                        { id: 's3', title: "KMFW's Inaugural Newsletter", pdfUrl: "/newsletters/Inaugural-Newsletter.pdf", date: "Inaugural", isActive: true }
                                    ];
                                    setNewsletters(prev => {
                                        const existing = new Set(prev.map(n => n.title));
                                        return [...samples.filter(s => !existing.has(s.title)), ...prev];
                                    });
                                }}>Seed PDFs</Button>
                                <Button variant="outline" onClick={addNewsletter} startIcon={<PlusIcon className="w-4 h-4" />}>Add PDF</Button>
                                <Button onClick={handleSavePdfs} disabled={savingPdfs}>{savingPdfs ? "Saving..." : "Save PDF Changes"}</Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {newsletters.map((item, index) => (
                                <div key={item.id || index} className="p-4 border border-gray-100 rounded-xl bg-gray-50 dark:bg-gray-900/20 dark:border-gray-700">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                        <div className="md:col-span-1">
                                            <Label>Title</Label>
                                            <Input value={item.title} onChange={(e) => updateNewsletter(index, "title", e.target.value)} />
                                        </div>
                                        <div className="md:col-span-1">
                                            <FilePicker
                                                label="PDF Document"
                                                value={item.pdfUrl}
                                                onChange={(url) => updateNewsletter(index, "pdfUrl", url)}
                                                placeholder="Paste a URL or browse the media library"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 text-xs">
                                                <Label>Period</Label>
                                                <Input value={item.date} onChange={(e) => updateNewsletter(index, "date", e.target.value)} />
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => deleteNewsletter(index)} className="text-red-500 mt-5"><TrashBinIcon className="w-5 h-5" /></Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {newsletters.length === 0 && <div className="text-center py-12 bg-gray-50 rounded-lg">No PDFs seeded yet.</div>}
                        </div>
                    </div>
                )}

                {/* Tab 2: News Articles */}
                {activeTab === 'news' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-700 dark:text-gray-200">Media Features & Breaking News</h3>
                            <div className="flex gap-3">
                                <Button requireSuperAdmin variant="outline" onClick={seedNews} disabled={savingNews}>Seed News</Button>
                                <Button onClick={openNewArticleModal} startIcon={<PlusIcon className="w-4 h-4" />}>New News Item</Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {articles.map((article) => (
                                <div key={article.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm flex flex-col">
                                    <div className="h-40 bg-gray-100 relative">
                                        <img src={article.imageUrl || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=400&q=80'} className="w-full h-full object-cover" />
                                        <div className="absolute top-2 left-2 flex gap-2">
                                            <div className="bg-primary/90 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">{article.category}</div>
                                        </div>
                                        <div className="absolute top-2 right-2 flex gap-2">
                                            {article.published ? (
                                                (article.date && new Date(article.date?.seconds ? article.date.seconds * 1000 : article.date) > new Date()) ? (
                                                    <div className="bg-blue-500 text-white px-2 py-1 rounded text-[10px] font-bold uppercase">Scheduled</div>
                                                ) : (
                                                    <div className="bg-green-500 text-white px-2 py-1 rounded text-[10px] font-bold uppercase">Published</div>
                                                )
                                            ) : (
                                                <div className="bg-gray-500 text-white px-2 py-1 rounded text-[10px] font-bold uppercase">Draft</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col">
                                        <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1 mb-1">{article.title}</h4>
                                        <div className="flex items-center text-[11px] text-gray-500 mb-2">
                                            <CalenderIcon className="w-3 h-3 mr-1" />
                                            {article.date?.seconds ? new Date(article.date.seconds * 1000).toLocaleDateString() : article.date?.toLocaleDateString()}
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-4">{article.excerpt}</p>
                                        <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <Button variant="outline" size="sm" onClick={() => openEditArticleModal(article)} className="flex-1"><PencilIcon className="w-4 h-4 mr-2" /> Edit</Button>
                                            <Button variant="outline" size="sm" onClick={() => handleDeleteArticle(article.id)} className="text-red-500"><TrashBinIcon className="w-4 h-4" /></Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {articles.length === 0 && <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">No news features found.</div>}
                        </div>
                    </div>
                )}

                {/* Modals */}

                <Modal isOpen={isArticleModalOpen} onClose={() => setIsArticleModalOpen(false)} className="max-w-4xl h-[90vh]">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center"><h2 className="text-xl font-bold">{currentArticleId ? "Edit Feature" : "New Feature"}</h2><button onClick={() => setIsArticleModalOpen(false)} className="text-2xl">&times;</button></div>
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-4">
                        <Label>Title</Label><Input value={articleFormData.title} onChange={(e) => setArticleFormData({...articleFormData, title: e.target.value})} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Status</Label>
                                <select
                                    className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm font-medium"
                                    value={
                                        !articleFormData.published 
                                            ? "draft" 
                                            : (articleFormData.date && new Date(articleFormData.date) > new Date()) 
                                                ? "scheduled" 
                                                : "published"
                                    }
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === 'draft') {
                                            setArticleFormData({ ...articleFormData, published: false });
                                        } else if (val === 'published') {
                                            const now = new Date();
                                            setArticleFormData({ 
                                                ...articleFormData, 
                                                published: true,
                                                date: (articleFormData.date && new Date(articleFormData.date) > now) ? now : articleFormData.date 
                                            });
                                        } else if (val === 'scheduled') {
                                            setArticleFormData({ ...articleFormData, published: true });
                                        }
                                    }}
                                >
                                    <option value="draft">Draft (Hidden)</option>
                                    <option value="published">Published (Live Now)</option>
                                    <option value="scheduled">Scheduled (Publishes at Date)</option>
                                </select>
                            </div>
                            <div>
                                <Label>Publish Date</Label>
                                <Input
                                    type="datetime-local"
                                    value={formatDateForInput(articleFormData.date)}
                                    onChange={(e) => setArticleFormData({ ...articleFormData, date: new Date(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Author</Label><Input value={articleFormData.author || ''} onChange={(e) => setArticleFormData({...articleFormData, author: e.target.value})} /></div>
                            <div><Label>Category</Label><Input value={articleFormData.category || ''} onChange={(e) => setArticleFormData({...articleFormData, category: e.target.value})} /></div>
                        </div>
                        <Label>Excerpt</Label><Input value={articleFormData.excerpt || ''} onChange={(e) => setArticleFormData({...articleFormData, excerpt: e.target.value})} />
                        <Label>Image URL</Label>
                        <div className="flex gap-2">
                             <Input value={articleFormData.imageUrl || ''} onChange={(e) => setArticleFormData({...articleFormData, imageUrl: e.target.value})} className="flex-1" />
                             <Button variant="outline" onClick={() => setIsMediaLibraryOpen(true)}><FolderIcon className="w-5 h-5" /></Button>
                        </div>
                        <Label>Full Content (Optional)</Label>
                        <RichTextEditor label="" value={articleFormData.content || ""} onChange={(val) => setArticleFormData({ ...articleFormData, content: val })} />
                    </div>
                    <div className="p-6 border-t border-gray-200 flex justify-end gap-3 rounded-b-3xl bg-white"><Button variant="outline" onClick={() => setIsArticleModalOpen(false)}>Cancel</Button><Button onClick={handleSaveArticle} disabled={savingNews}>{savingNews ? "Saving..." : "Save News Item"}</Button></div>
                </Modal>

                <MediaLibrary isOpen={isMediaLibraryOpen} onSelect={(url) => { setArticleFormData({ ...articleFormData, imageUrl: url }); setIsMediaLibraryOpen(false); }} basePath={currentSite.id} onClose={() => setIsMediaLibraryOpen(false)} />
            </div>
        </>
    );
}
