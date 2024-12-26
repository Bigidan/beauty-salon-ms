import MainHeader from "@/components/navigation/main-header";

export default function MainLayout({ children, }: Readonly<{ children: React.ReactNode; }>) {
    return (
        <div className="flex flex-col">
            <MainHeader/>
            <div className="flex-1 min-h-[91.3vh]">{children}</div>

        </div>
    );
}
