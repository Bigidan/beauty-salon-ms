
export default function Home() {
  return (
    <div className="font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
          <div className="min-h-screen px-10 py-5 grid grid-cols-5 grid-rows-5 relative">
              <img src="1.webp" alt="" className="absolute right-0 top-[30%] w-[700px] h-auto -z-10"/>
              <img src="2.jpg" alt="" className="absolute left-[40px] top-[40px] w-[300px] h-auto -z-10"/>
              <img src="3.jpg" alt="" className="absolute left-[40px] bottom-[150px] w-[500px] h-auto -z-10"/>

              <div className="font-bold text-2xl row-start-2 col-start-6">Салон краси Miso.</div>
              <div className="font-bold text-3xl row-start-3 col-start-4">Ми пропонуємо найкращі процедури на ринку!
              </div>
              <div className="font-bold text-6xl row-start-2 col-start-2">Допоможіть своїй шкірі</div>
          </div>
      </main>
        <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">

        </footer>
    </div>
  );
}
