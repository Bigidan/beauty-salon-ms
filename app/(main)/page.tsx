
export default function Home() {
  return (
    <div className="font-[family-name:var(--font-geist-sans)] mx-auto">
      <main className="flex relative h-full">

          <div className="grid grid-cols-3 w-full h-full top-0 left-0 absolute items-center">
              <img src="./1.png" className="col-start-1"/>
              <img src="./2.png" className="col-start-3"/>
          </div>

          <div className="flex flex-col justify-center items-center">
              <div>
                  <span className="font-extrabold text-9xl">
                      MISO
                  </span>
                  <span className="font-extrabold text-6xl">
                      BEAUTY SALON
                  </span>
              </div>
              <div className="font-bold text-4xl w-2/5 text-center">місце, де кожен клієнт отримує індивідуальний підхід і професійний догляд. Ми створюємо атмосферу затишку, релаксу та довіри, щоб ви відчували себе по-справжньому особливими.
              </div>
          </div>



      </main>
        <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">

        </footer>
    </div>
  );
}
