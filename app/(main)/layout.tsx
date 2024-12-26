import MainHeader from "@/components/navigation/main-header";

export default function MainLayout({ children, }: Readonly<{ children: React.ReactNode; }>) {
    return (
        <div className="flex flex-col">
            <MainHeader/>
            <div className="m-hero flex" style={{ backgroundImage: `url(./5640508.jpg)` }}>{children}</div>

        </div>
    );
}
