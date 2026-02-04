'use client'

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Package, User, Shield, LogOut, ChevronRight, Clock, CheckCircle, X, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateProfile, updatePassword } from "./actions";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase-client";
import { Order, OrderItem } from "@/types/order";

// Helper to format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// Helper to format date
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

interface UserDashboardProps {
    profile: any;
    email?: string;
    orders?: Order[];
}

export function UserDashboard({ profile, email, orders = [] }: UserDashboardProps) {
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'orders'>('profile');
    const router = useRouter();

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh(); // Refresh to update header state
    };

    return (
        <div className="min-h-screen bg-[#FFFDF5] pt-36 pb-12 px-6 md:px-12">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row gap-12">

                    {/* Sidebar - 25% width */}
                    <aside className="w-full md:w-1/4">
                        <div className="sticky top-32">
                            <h2 className="text-xl font-serif text-[#990000] mb-8 px-4">My Account</h2>
                            <nav className="flex flex-col space-y-2">
                                <SidebarItem
                                    icon={<User className="w-4 h-4" />}
                                    label="My Profile"
                                    isActive={activeTab === 'profile'}
                                    onClick={() => setActiveTab('profile')}
                                />
                                <SidebarItem
                                    icon={<Shield className="w-4 h-4" />}
                                    label="Security"
                                    isActive={activeTab === 'security'}
                                    onClick={() => setActiveTab('security')}
                                />
                                <SidebarItem
                                    icon={<Package className="w-4 h-4" />}
                                    label="Order History"
                                    isActive={activeTab === 'orders'}
                                    onClick={() => setActiveTab('orders')}
                                />

                                <div className="pt-8 mt-4 border-t border-[#990000]/10">
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#990000] hover:bg-[#990000]/5 transition-colors text-left group"
                                    >
                                        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                        Sign Out
                                    </button>
                                </div>
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content - 75% width */}
                    <main className="w-full md:w-3/4 min-h-[600px]">
                        {/* Using key to force re-render/animation on tab switch */}
                        <AnimatePresence mode="wait">
                            {activeTab === 'profile' && (
                                <ProfileSection
                                    key="profile"
                                    profile={profile}
                                    email={email}
                                />
                            )}
                            {activeTab === 'security' && <SecuritySection key="security" />}
                            {activeTab === 'orders' && <OrdersSection key="orders" orders={orders} />}
                        </AnimatePresence>
                    </main>

                </div>
            </div>
        </div>
    );
}

function SidebarItem({ icon, label, isActive, onClick }: { icon: any, label: string, isActive: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-300 text-left relative overflow-hidden rounded-md
        ${isActive ? 'text-[#990000] bg-white shadow-sm border border-[#990000]/10' : 'text-[#333333]/60 hover:text-[#990000] hover:bg-[#990000]/5'}
      `}
        >
            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#990000]" />}
            <span className={isActive ? 'opacity-100' : 'opacity-70'}>{icon}</span>
            {label}
        </button>
    );
}

function ProfileSection({ profile, email }: { profile: any, email?: string }) {
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await updateProfile(formData);
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("Profile updated successfully");
            }
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
        >
            <div className="border-b border-[#990000]/10 pb-6">
                <h1 className="text-3xl font-serif text-[#990000]">Personal Information</h1>
                <p className="text-[#333333]/60 mt-2 text-sm">Manage your personal details and shipping preferences.</p>
            </div>

            <form className="space-y-8" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    <InputGroup label="Full Name" name="full_name" defaultValue={profile?.full_name || ''} />
                    <InputGroup label="Email Address" defaultValue={email || ''} disabled />
                    <InputGroup label="Phone Number" name="phone" defaultValue={profile?.phone || ''} />
                    <InputGroup label="Date of Birth" name="date_of_birth" defaultValue={profile?.date_of_birth || ''} placeholder="YYYY-MM-DD" type="date" />
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#990000]/80">Gender</label>
                    <div className="flex gap-6">
                        <RadioOption label="Male" name="gender" value="Male" defaultChecked={profile?.gender === 'Male'} />
                        <RadioOption label="Female" name="gender" value="Female" defaultChecked={profile?.gender === 'Female'} />
                        <RadioOption label="Other" name="gender" value="Other" defaultChecked={profile?.gender === 'Other'} />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#990000]/80">Shipping Address</label>
                    <textarea
                        name="address"
                        rows={3}
                        className="w-full bg-transparent border-b border-[#990000]/20 focus:border-[#990000] outline-none py-2 transition-colors resize-none text-[#333333]"
                        defaultValue={profile?.address || ''}
                        placeholder="123 Le Loi Street..."
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="h-12 px-8 bg-[#FFB800] text-[#990000] text-xs font-bold uppercase tracking-widest hover:bg-[#990000] hover:text-[#FFB800] transition-colors duration-300 disabled:opacity-50"
                    >
                        {isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </motion.div>
    );
}

function SecuritySection() {
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await updatePassword(formData);
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("Password updated successfully");
            }
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
        >
            <div className="border-b border-[#990000]/10 pb-6">
                <h1 className="text-3xl font-serif text-[#990000]">Login Details</h1>
                <p className="text-[#333333]/60 mt-2 text-sm">Update your password to keep your account secure.</p>
            </div>

            <form className="max-w-md space-y-8" onSubmit={handleSubmit}>
                <div className="space-y-6">
                    <div className="pt-2 space-y-6">
                        <InputGroup label="New Password" name="password" type="password" />
                        <InputGroup label="Confirm New Password" name="confirmPassword" type="password" />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                    <button type="button" className="text-xs text-[#990000]/70 hover:text-[#990000] hover:underline transition-all">
                        Forgot Password?
                    </button>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="h-12 px-8 bg-[#FFB800] text-[#990000] text-xs font-bold uppercase tracking-widest hover:bg-[#990000] hover:text-[#FFB800] transition-colors duration-300 disabled:opacity-50"
                    >
                        {isPending ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
            </form>
        </motion.div>
    );
}

function OrdersSection({ orders }: { orders: Order[] }) {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
            >
                <div className="border-b border-[#990000]/10 pb-6">
                    <h1 className="text-3xl font-serif text-[#990000]">My Orders</h1>
                    <p className="text-[#333333]/60 mt-2 text-sm">Track and view details of your past purchases.</p>
                </div>

                {orders.length === 0 ? (
                    <div className="text-center py-12 bg-white border border-[#990000]/10">
                        <ShoppingBag className="w-12 h-12 mx-auto text-[#990000]/20 mb-4" />
                        <p className="text-[#333333]/60">You haven't placed any orders yet.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onClick={() => setSelectedOrder(order)}
                            />
                        ))}
                    </div>
                )}
            </motion.div>

            <AnimatePresence>
                {selectedOrder && (
                    <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
                )}
            </AnimatePresence>
        </>
    );
}

function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
    const items = order.items || [];
    const itemCount = items.length;
    // Limit thumbnails
    const thumbnails = items.slice(0, 3).map(i => i.image_url || '/placeholder.png');
    const extraCount = items.length - 3;

    return (
        <div className="group bg-white border border-[#990000]/10 p-6 flex flex-col md:flex-row gap-6 hover:shadow-lg hover:shadow-[#990000]/5 transition-all duration-300">

            {/* Thumbnails */}
            <div className="flex -space-x-4 overflow-hidden md:w-1/4 min-h-[96px]">
                {items.length > 0 ? thumbnails.map((src, i) => (
                    <div key={i} className="w-20 h-24 relative flex-shrink-0 border-2 border-white shadow-sm bg-gray-100">
                        <img src={src} alt="Order item" className="w-full h-full object-cover" />
                    </div>
                )) : (
                    <div className="w-20 h-24 relative flex-shrink-0 border-2 border-white shadow-sm bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                        No Img
                    </div>
                )}
                {extraCount > 0 && (
                    <div className="w-20 h-24 flex items-center justify-center bg-[#F2F0E6] text-[#990000] text-xs font-bold border-2 border-white">
                        +{extraCount}
                    </div>
                )}
            </div>

            {/* Details */}
            <div className="flex-1 flex flex-col justify-center space-y-1">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[#333333]">Order #{order.id.slice(0, 8)}</span>
                    <span className="text-xs text-[#333333]/40 px-2 py-0.5 border border-[#333333]/10 rounded-full">{formatDate(order.created_at)}</span>
                </div>
                <div className="text-xl font-serif text-[#990000]">{formatCurrency(order.total_amount)}</div>
                <div className="text-xs text-[#333333]/60">{itemCount} item{itemCount !== 1 && 's'}</div>
            </div>

            {/* Status & Action */}
            <div className="flex flex-row md:flex-col justify-between items-center md:items-end md:w-1/4 border-t md:border-t-0 md:border-l border-[#990000]/10 pt-4 md:pt-0 md:pl-6">
                <StatusBadge status={order.status} />

                <button
                    onClick={onClick}
                    className="text-xs font-bold text-[#333333] hover:text-[#990000] flex items-center gap-1 group-hover:gap-2 transition-all mt-2"
                >
                    View Details <ChevronRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    let classes = "";
    let icon = null;

    switch (status) {
        case 'pending':
        case 'processing':
            classes = "bg-[#FFB800]/20 text-[#D97706]";
            icon = <Clock className="w-3 h-3" />;
            break;
        case 'delivered':
        case 'completed':
            classes = "bg-green-100 text-green-800";
            icon = <CheckCircle className="w-3 h-3" />;
            break;
        case 'cancelled':
            classes = "bg-red-100 text-red-800";
            icon = <X className="w-3 h-3" />;
            break;
        default:
            classes = "bg-gray-100 text-gray-800";
    }

    return (
        <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${classes}`}>
            {icon}
            {status}
        </div>
    );
}

function OrderDetailModal({ order, onClose }: { order: Order, onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-2xl relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
                <div className="p-6 border-b border-[#990000]/10 flex justify-between items-start sticky top-0 bg-white z-20">
                    <div>
                        <h3 className="text-xl font-serif text-[#990000]">Order Details</h3>
                        <p className="text-sm text-[#333333]/60">#{order.id}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-[#333333]" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex flex-wrap gap-4 justify-between bg-[#F2F0E6]/30 p-4 rounded-sm border border-[#990000]/5">
                        <div>
                            <p className="text-xs uppercase text-[#990000]/60 font-medium">Date Placed</p>
                            <p className="text-sm font-medium text-[#333333]">{formatDate(order.created_at)}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-[#990000]/60 font-medium">Total Amount</p>
                            <p className="text-sm font-medium text-[#990000]">{formatCurrency(order.total_amount)}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-[#990000]/60 font-medium">Status</p>
                            <StatusBadge status={order.status} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-[#990000]">Items</h4>
                        <div className="space-y-3">
                            {order.items?.map((item) => (
                                <div key={item.id} className="flex gap-4 items-center border-b border-dashed border-[#990000]/10 pb-3">
                                    <div className="w-16 h-20 bg-gray-100 flex-shrink-0 border border-gray-200">
                                        <img src={item.image_url || '/placeholder.png'} alt={item.product_name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-[#333333]">{item.product_name}</p>
                                        <p className="text-xs text-[#333333]/60">
                                            {item.color && item.color + ' / '}
                                            {item.size && item.size + ' / '}
                                            Qty: {item.quantity}
                                        </p>
                                    </div>
                                    <div className="text-sm font-bold text-[#333333]">
                                        {formatCurrency(item.price * item.quantity)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between pt-4 border-t border-[#990000]/20">
                        <span className="font-bold text-[#333333]">Total</span>
                        <span className="font-bold text-[#990000] text-lg">{formatCurrency(order.total_amount)}</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function InputGroup({ label, name, type = "text", placeholder, defaultValue, disabled = false }: { label: string, name?: string, type?: string, placeholder?: string, defaultValue?: string, disabled?: boolean }) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-[#990000]/80">{label}</label>
            <input
                name={name}
                type={type}
                defaultValue={defaultValue}
                placeholder={placeholder}
                disabled={disabled}
                className={`w-full h-10 bg-transparent border-b border-[#990000]/20 px-0 focus:border-[#990000] outline-none transition-all duration-300 text-[#333333] placeholder:text-[#333333]/30 
          ${disabled ? 'opacity-50 cursor-not-allowed border-dashed' : 'focus:bg-[#FFFDF5]'}
        `}
            />
        </div>
    );
}

function RadioOption({ label, name, value, defaultChecked }: { label: string, name: string, value: string, defaultChecked?: boolean }) {
    return (
        <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative flex items-center">
                <input type="radio" name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
                <div className="w-4 h-4 border border-[#990000]/40 rounded-full peer-checked:border-[#990000] peer-checked:bg-[#990000] transition-all"></div>
                <div className="absolute inset-0 m-auto w-1.5 h-1.5 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
            </div>
            <span className="text-sm text-[#333333]/80 group-hover:text-[#990000] transition-colors">{label}</span>
        </label>
    );
}
