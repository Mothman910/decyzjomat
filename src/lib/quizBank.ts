import type { QuizAxisId, QuizPackId } from '@/types/room';

export const QUIZ_ID = 'gusty-v1' as const;
export const QUIZ_VERSION = 1;
export const QUIZ_QUESTIONS_PER_RUN = 20;

export type QuizOption = {
	id: string;
	label: string;
	weights: Partial<Record<QuizAxisId, number>>;
};

export type QuizQuestion = {
	id: string;
	packId: Exclude<QuizPackId, 'mix'>;
	prompt: string;
	options: QuizOption[];
};

export const QUIZ_PACKS: Record<QuizPackId, { label: string }> = {
	interiors: { label: 'Wnętrza' },
	lifestyle: { label: 'Lifestyle' },
	food: { label: 'Jedzenie' },
	activities: { label: 'Zajęcia, relax i rozrywki' },
	mix: { label: 'Mix' },
};

const interiors: QuizQuestion[] = [
	{
		id: 'int-style-1',
		packId: 'interiors',
		prompt: 'Jaki styl wnętrz najbardziej Ci się podoba?',
		options: [
			{ id: 'scandi', label: 'Skandynawski', weights: { minimalMaximal: -2, naturalIndustrial: -1, warmCool: -1, modernClassic: 1 } },
			{ id: 'industrial', label: 'Industrialny', weights: { naturalIndustrial: 2, warmCool: 1, modernClassic: 1, minimalMaximal: -1 } },
			{ id: 'classic', label: 'Klasyczny', weights: { modernClassic: -2, minimalMaximal: 1, socialCozy: 1 } },
			{ id: 'maximal', label: 'Eklektyczny / maksymalizm', weights: { minimalMaximal: 3, boldSafe: 2, modernClassic: 1 } },
		],
	},
	{
		id: 'int-color-temp-1',
		packId: 'interiors',
		prompt: 'Wnętrze: wolisz ciepłe czy chłodne barwy?',
		options: [
			{ id: 'warm', label: 'Ciepłe (beże, złoto, terakota)', weights: { warmCool: -3, socialCozy: 1 } },
			{ id: 'cool', label: 'Chłodne (szarości, błękity, stal)', weights: { warmCool: 3 } },
			{ id: 'balanced', label: 'Zbalansowane (mix)', weights: { warmCool: 0 } },
			{ id: 'depends', label: 'Zależy od pomieszczenia', weights: { planSpontaneous: -1, boldSafe: -1 } },
		],
	},
	{
		id: 'int-furniture-1',
		packId: 'interiors',
		prompt: 'Meble: bardziej proste czy ozdobne?',
		options: [
			{ id: 'simple', label: 'Proste i gładkie', weights: { minimalMaximal: -2, modernClassic: 2 } },
			{ id: 'ornate', label: 'Ozdobne / z detalem', weights: { minimalMaximal: 2, modernClassic: -1 } },
			{ id: 'mix', label: 'Mix: proste + 1 mocny akcent', weights: { boldSafe: 1, minimalMaximal: 0 } },
			{ id: 'vintage', label: 'Vintage / z historią', weights: { modernClassic: -2, naturalIndustrial: -1, socialCozy: 1 } },
		],
	},
	{
		id: 'int-light-1',
		packId: 'interiors',
		prompt: 'Oświetlenie w domu: co wolisz?',
		options: [
			{ id: 'soft', label: 'Miękkie, ciepłe światło', weights: { warmCool: -2, socialCozy: 2 } },
			{ id: 'bright', label: 'Jasno i funkcjonalnie', weights: { planSpontaneous: -1, minimalMaximal: -1 } },
			{ id: 'smart', label: 'Smart (sceny, regulacja)', weights: { modernClassic: 2, planSpontaneous: -1 } },
			{ id: 'candles', label: 'Świeczki/klimat', weights: { socialCozy: 3, warmCool: -1 } },
		],
	},
	{
		id: 'int-materials-1',
		packId: 'interiors',
		prompt: 'Materiały: co Cię najbardziej przyciąga?',
		options: [
			{ id: 'wood', label: 'Drewno i naturalne tkaniny', weights: { naturalIndustrial: -3, warmCool: -1, socialCozy: 1 } },
			{ id: 'metal', label: 'Metal, beton, szkło', weights: { naturalIndustrial: 3, warmCool: 1, modernClassic: 1 } },
			{ id: 'lux', label: 'Welur, marmur, „premium vibe”', weights: { budgetPremium: 3, minimalMaximal: 1 } },
			{ id: 'practical', label: 'Praktyczne i trwałe (łatwe w czyszczeniu)', weights: { budgetPremium: -1, planSpontaneous: -1, boldSafe: -1 } },
		],
	},
	{
		id: 'int-decor-1',
		packId: 'interiors',
		prompt: 'Dekoracje: jak bardzo lubisz „ozdabiać” przestrzeń?',
		options: [
			{ id: 'none', label: 'Minimalnie (czysto, pusto)', weights: { minimalMaximal: -3, boldSafe: -1 } },
			{ id: 'some', label: 'Kilka akcentów', weights: { minimalMaximal: -1, boldSafe: 0 } },
			{ id: 'many', label: 'Dużo (obrazy, plakaty, bibeloty)', weights: { minimalMaximal: 3, boldSafe: 1 } },
			{ id: 'plants', label: 'Rośliny przede wszystkim', weights: { naturalIndustrial: -2, socialCozy: 1 } },
		],
	},
	{
		id: 'int-floor-1',
		packId: 'interiors',
		prompt: 'Podłoga: co wybierasz, gdybyś mógł/mogła?',
		options: [
			{ id: 'wood', label: 'Drewno / parkiet', weights: { naturalIndustrial: -2, warmCool: -1, modernClassic: -1 } },
			{ id: 'concrete', label: 'Beton / mikrocement', weights: { naturalIndustrial: 3, warmCool: 1, modernClassic: 2 } },
			{ id: 'carpet', label: 'Miękko (dywany, wykładziny)', weights: { socialCozy: 2, warmCool: -1, minimalMaximal: 1 } },
			{ id: 'tiles', label: 'Płytki (praktycznie)', weights: { planSpontaneous: -1, boldSafe: -1 } },
		],
	},
	{
		id: 'int-walls-1',
		packId: 'interiors',
		prompt: 'Ściany: jaki klimat Cię kręci?',
		options: [
			{ id: 'white', label: 'Jasne i neutralne', weights: { minimalMaximal: -2, boldSafe: -2 } },
			{ id: 'dark', label: 'Ciemne i nastrojowe', weights: { boldSafe: 2, warmCool: 1, minimalMaximal: 1 } },
			{ id: 'color', label: 'Kolor jako akcent', weights: { boldSafe: 1, minimalMaximal: 0 } },
			{ id: 'texture', label: 'Tekstura (cegła, tynk, lamele)', weights: { naturalIndustrial: 1, minimalMaximal: 1 } },
		],
	},
	{
		id: 'int-clutter-1',
		packId: 'interiors',
		prompt: 'Porządek na co dzień: bliżej Ci do…',
		options: [
			{ id: 'minimal', label: '„Wszystko schowane”', weights: { minimalMaximal: -3, planSpontaneous: -2 } },
			{ id: 'visible', label: '„Lubię, jak rzeczy żyją na wierzchu”', weights: { minimalMaximal: 2, planSpontaneous: 1 } },
			{ id: 'mixed', label: 'Mix (część schowana, część na wierzchu)', weights: { minimalMaximal: 0 } },
			{ id: 'depends', label: 'Zależy od tygodnia', weights: { planSpontaneous: 2 } },
		],
	},
	{
		id: 'int-storage-1',
		packId: 'interiors',
		prompt: 'Przechowywanie: co jest dla Ciebie ważniejsze?',
		options: [
			{ id: 'hidden', label: 'Ukryte (szafy, schowki)', weights: { minimalMaximal: -2, boldSafe: -1 } },
			{ id: 'open', label: 'Otwarte (półki, ekspozycja)', weights: { minimalMaximal: 2, boldSafe: 1 } },
			{ id: 'modular', label: 'Modułowo (łatwo przestawiać)', weights: { planSpontaneous: 2, modernClassic: 1 } },
			{ id: 'design', label: 'Design nawet kosztem miejsca', weights: { budgetPremium: 2, boldSafe: 1 } },
		],
	},
	{
		id: 'int-symmetry-1',
		packId: 'interiors',
		prompt: 'Kompozycja: wolisz symetrię czy swobodę?',
		options: [
			{ id: 'sym', label: 'Symetria i porządek', weights: { planSpontaneous: -2, minimalMaximal: -1 } },
			{ id: 'free', label: 'Swoboda i naturalny układ', weights: { planSpontaneous: 2, naturalIndustrial: -1 } },
			{ id: 'mix', label: 'Mix', weights: { planSpontaneous: 0 } },
			{ id: 'art', label: '„Artystyczny chaos”', weights: { minimalMaximal: 2, boldSafe: 2 } },
		],
	},
	{
		id: 'int-textiles-1',
		packId: 'interiors',
		prompt: 'Tekstylia: co Cię najbardziej cieszy?',
		options: [
			{ id: 'soft', label: 'Miękkie koce i poduszki', weights: { socialCozy: 2, warmCool: -1 } },
			{ id: 'linen', label: 'Len / naturalne tkaniny', weights: { naturalIndustrial: -2, minimalMaximal: -1 } },
			{ id: 'velvet', label: 'Welur / „premium” klimat', weights: { budgetPremium: 2, minimalMaximal: 1 } },
			{ id: 'none', label: 'Mało (żeby nie zbierać kurzu)', weights: { minimalMaximal: -2, boldSafe: -1 } },
		],
	},
	{
		id: 'int-art-1',
		packId: 'interiors',
		prompt: 'Sztuka na ścianach: co wybierasz?',
		options: [
			{ id: 'posters', label: 'Plakaty / grafiki', weights: { modernClassic: 1, boldSafe: 1 } },
			{ id: 'classic', label: 'Klasyczne obrazy', weights: { modernClassic: -2, minimalMaximal: 1 } },
			{ id: 'photo', label: 'Zdjęcia (wspomnienia)', weights: { socialCozy: 2 } },
			{ id: 'none', label: 'Raczej bez', weights: { minimalMaximal: -2 } },
		],
	},
	{
		id: 'int-kitchen-1',
		packId: 'interiors',
		prompt: 'Kuchnia: bliżej Ci do…',
		options: [
			{ id: 'closed', label: 'Zamkniętej (porządek, brak zapachów)', weights: { planSpontaneous: -1, minimalMaximal: -1 } },
			{ id: 'open', label: 'Otwartej (integracja z salonem)', weights: { socialCozy: -2, planSpontaneous: 1 } },
			{ id: 'design', label: 'Efektownej (wyspa, akcenty)', weights: { budgetPremium: 2, minimalMaximal: 2 } },
			{ id: 'practical', label: 'Maksymalnie praktycznej', weights: { boldSafe: -1, budgetPremium: -1 } },
		],
	},
	{
		id: 'int-bathroom-1',
		packId: 'interiors',
		prompt: 'Łazienka: co wybierasz?',
		options: [
			{ id: 'spa', label: 'SPA vibe (nastrojowo)', weights: { socialCozy: 2, warmCool: -1 } },
			{ id: 'hotel', label: 'Hotelowo (czysto, premium)', weights: { budgetPremium: 2, minimalMaximal: -1 } },
			{ id: 'minimal', label: 'Minimalnie i funkcjonalnie', weights: { minimalMaximal: -2, planSpontaneous: -1 } },
			{ id: 'color', label: 'Z charakterem (kolor/cegła)', weights: { boldSafe: 2, naturalIndustrial: 1 } },
		],
	},
	{
		id: 'int-scent-1',
		packId: 'interiors',
		prompt: 'Zapachy w domu:',
		options: [
			{ id: 'candles', label: 'Świeczki / dyfuzory – tak!', weights: { socialCozy: 2, minimalMaximal: 1 } },
			{ id: 'fresh', label: 'Wystarczy świeże powietrze', weights: { minimalMaximal: -1 } },
			{ id: 'subtle', label: 'Delikatnie, od czasu do czasu', weights: { boldSafe: -1 } },
			{ id: 'no', label: 'Raczej nie', weights: { boldSafe: -1, minimalMaximal: -1 } },
		],
	},
	{
		id: 'int-project-1',
		packId: 'interiors',
		prompt: 'Remont/urządzanie: jak wolisz podchodzić?',
		options: [
			{ id: 'plan', label: 'Plan + budżet + harmonogram', weights: { planSpontaneous: -3, budgetPremium: -1 } },
			{ id: 'iterate', label: 'Iteracyjnie (krok po kroku)', weights: { planSpontaneous: -1 } },
			{ id: 'inspire', label: 'Inspiracje i spontaniczne decyzje', weights: { planSpontaneous: 2, boldSafe: 1 } },
			{ id: 'outs', label: 'Zlecę/projektant', weights: { budgetPremium: 2, planSpontaneous: -1 } },
		],
	},
	{
		id: 'int-accent-1',
		packId: 'interiors',
		prompt: 'Wnętrze: „mocny akcent” to dla Ciebie…',
		options: [
			{ id: 'yes', label: 'Tak, lubię 1–2 odważne elementy', weights: { boldSafe: 2 } },
			{ id: 'subtle', label: 'Raczej subtelnie', weights: { boldSafe: -1 } },
			{ id: 'no', label: 'Nie, wolę spójność i spokój', weights: { boldSafe: -2, minimalMaximal: -1 } },
			{ id: 'depends', label: 'Zależy od pomieszczenia', weights: { planSpontaneous: 1 } },
		],
	},
	{
		id: 'int-light-2',
		packId: 'interiors',
		prompt: 'Oświetlenie: jaki klimat lubisz?',
		options: [
			{ id: 'warm', label: 'Ciepłe i przytulne', weights: { warmCool: -3, socialCozy: 2 } },
			{ id: 'neutral', label: 'Neutralne', weights: { warmCool: 0 } },
			{ id: 'cool', label: 'Chłodne i „czyste”', weights: { warmCool: 3, modernClassic: 1 } },
			{ id: 'mix', label: 'Mix (warstwy światła)', weights: { budgetPremium: 1, planSpontaneous: -1 } },
		],
	},
	{
		id: 'int-bedroom-1',
		packId: 'interiors',
		prompt: 'Sypialnia: bardziej…',
		options: [
			{ id: 'hotel', label: 'Hotelowo (równo, minimalistycznie)', weights: { minimalMaximal: -2, budgetPremium: 1 } },
			{ id: 'cozy', label: 'Miękko i przytulnie', weights: { socialCozy: 2, warmCool: -1 } },
			{ id: 'design', label: 'Design i detale', weights: { minimalMaximal: 1, budgetPremium: 2 } },
			{ id: 'practical', label: 'Praktycznie (wygoda > wygląd)', weights: { boldSafe: -1 } },
		],
	},
];

const lifestyle: QuizQuestion[] = [
	{
		id: 'life-weekend-1',
		packId: 'lifestyle',
		prompt: 'Idealny weekend to…',
		options: [
			{ id: 'plan', label: 'Zaplanowany (konkretny plan i godziny)', weights: { planSpontaneous: -3 } },
			{ id: 'mix', label: 'Plan + luz (1–2 punkty i reszta spontanicznie)', weights: { planSpontaneous: -1 } },
			{ id: 'spont', label: 'Spontaniczny (zobaczymy na miejscu)', weights: { planSpontaneous: 3 } },
			{ id: 'home', label: 'Domowo i spokojnie', weights: { socialCozy: 3, planSpontaneous: 0 } },
		],
	},
	{
		id: 'life-social-1',
		packId: 'lifestyle',
		prompt: 'Częściej wybierasz…',
		options: [
			{ id: 'people', label: 'Spotkania z ludźmi', weights: { socialCozy: -3 } },
			{ id: 'small', label: 'Małe grono / kameralnie', weights: { socialCozy: 1 } },
			{ id: 'cozy', label: 'Spokój i „baza” w domu', weights: { socialCozy: 3 } },
			{ id: 'depends', label: 'Zależy od nastroju', weights: { planSpontaneous: 1 } },
		],
	},
	{
		id: 'life-risk-1',
		packId: 'lifestyle',
		prompt: 'Nowe rzeczy: jesteś bardziej…',
		options: [
			{ id: 'bold', label: 'Odważny/a (lubię próbować)', weights: { boldSafe: 3, planSpontaneous: 1 } },
			{ id: 'balanced', label: 'Zrównoważony/a', weights: { boldSafe: 0 } },
			{ id: 'safe', label: 'Bezpieczny/a (sprawdzone opcje)', weights: { boldSafe: -3, planSpontaneous: -1 } },
			{ id: 'context', label: 'Odważny/a, ale w kontrolowanych warunkach', weights: { boldSafe: 1, planSpontaneous: -1 } },
		],
	},
	{
		id: 'life-budget-1',
		packId: 'lifestyle',
		prompt: 'Wydatki na „przyjemności”: bliżej Ci do…',
		options: [
			{ id: 'save', label: 'Oszczędnie (poluję na okazje)', weights: { budgetPremium: -3, planSpontaneous: -1 } },
			{ id: 'value', label: 'Dobra jakość w rozsądnej cenie', weights: { budgetPremium: -1 } },
			{ id: 'premium', label: 'Premium (wolę rzadziej, ale lepiej)', weights: { budgetPremium: 2, boldSafe: 1 } },
			{ id: 'experience', label: 'Przeżycia > rzeczy', weights: { budgetPremium: 0, planSpontaneous: 1 } },
		],
	},
	{
		id: 'life-modern-1',
		packId: 'lifestyle',
		prompt: 'Technologie w domu i życiu:',
		options: [
			{ id: 'love', label: 'Uwielbiam (smart, automatyzacje)', weights: { modernClassic: 3, naturalIndustrial: 1 } },
			{ id: 'ok', label: 'Lubię, ale bez przesady', weights: { modernClassic: 1 } },
			{ id: 'neutral', label: 'Obojętne', weights: { modernClassic: 0 } },
			{ id: 'classic', label: 'Wolę analogowo/prosto', weights: { modernClassic: -2, minimalMaximal: -1 } },
		],
	},
	{
		id: 'life-morning-1',
		packId: 'lifestyle',
		prompt: 'Jesteś bardziej „rano” czy „wieczorem”?',
		options: [
			{ id: 'morning', label: 'Rano (lubię startować wcześnie)', weights: { planSpontaneous: -1 } },
			{ id: 'evening', label: 'Wieczorem (nocny vibe)', weights: { planSpontaneous: 1, socialCozy: 1 } },
			{ id: 'flex', label: 'Elastycznie', weights: { planSpontaneous: 2 } },
			{ id: 'depends', label: 'Zależy od dnia', weights: { planSpontaneous: 2 } },
		],
	},
	{
		id: 'life-travel-1',
		packId: 'lifestyle',
		prompt: 'Wyjazdy: bardziej…',
		options: [
			{ id: 'plan', label: 'Plan i rezerwacje z wyprzedzeniem', weights: { planSpontaneous: -3 } },
			{ id: 'mix', label: 'Plan minimum + luz', weights: { planSpontaneous: -1 } },
			{ id: 'spont', label: 'Spontanicznie (na żywo)', weights: { planSpontaneous: 3 } },
			{ id: 'comfort', label: 'Komfort i bezpieczeństwo', weights: { boldSafe: -2, budgetPremium: 1 } },
		],
	},
	{
		id: 'life-home-vs-out-1',
		packId: 'lifestyle',
		prompt: 'Po intensywnym tygodniu wolisz…',
		options: [
			{ id: 'home', label: 'Zostać w domu', weights: { socialCozy: 3 } },
			{ id: 'small', label: 'Kameralne wyjście', weights: { socialCozy: 1 } },
			{ id: 'out', label: 'Wyjście „do ludzi”', weights: { socialCozy: -3 } },
			{ id: 'trip', label: 'Wypad (mini podróż)', weights: { planSpontaneous: 2, boldSafe: 1 } },
		],
	},
	{
		id: 'life-gifts-1',
		packId: 'lifestyle',
		prompt: 'Prezenty: wolisz…',
		options: [
			{ id: 'practical', label: 'Praktyczne', weights: { boldSafe: -1, budgetPremium: -1 } },
			{ id: 'experience', label: 'Przeżycia (wyjście, wyjazd)', weights: { planSpontaneous: 1, budgetPremium: 1 } },
			{ id: 'surprise', label: 'Zaskoczenie (element niespodzianki)', weights: { planSpontaneous: 2, boldSafe: 1 } },
			{ id: 'handmade', label: 'Ręcznie/od serca', weights: { socialCozy: 2 } },
		],
	},
	{
		id: 'life-shopping-1',
		packId: 'lifestyle',
		prompt: 'Zakupy: co jest bardziej Twoje?',
		options: [
			{ id: 'research', label: 'Research i porównania', weights: { planSpontaneous: -2, boldSafe: -1 } },
			{ id: 'instinct', label: '„Biorę, jak mi się podoba”', weights: { planSpontaneous: 2, boldSafe: 1 } },
			{ id: 'quality', label: 'Jakość ponad ilość', weights: { budgetPremium: 2, minimalMaximal: -1 } },
			{ id: 'deals', label: 'Okazje i promocje', weights: { budgetPremium: -2 } },
		],
	},
	{
		id: 'life-style-1',
		packId: 'lifestyle',
		prompt: 'Styl ubierania: bliżej Ci do…',
		options: [
			{ id: 'minimal', label: 'Prosto i minimalistycznie', weights: { minimalMaximal: -2, boldSafe: -1 } },
			{ id: 'classic', label: 'Klasyka', weights: { modernClassic: -2, boldSafe: -1 } },
			{ id: 'street', label: 'Street / wygoda', weights: { planSpontaneous: 1, socialCozy: 1 } },
			{ id: 'bold', label: 'Wyrazisty styl', weights: { boldSafe: 2, minimalMaximal: 1 } },
		],
	},
	{
		id: 'life-decisions-1',
		packId: 'lifestyle',
		prompt: 'Decyzje w parze: bliżej Ci do…',
		options: [
			{ id: 'fast', label: 'Szybko decyduję', weights: { planSpontaneous: 1 } },
			{ id: 'analyze', label: 'Analizuję i porównuję', weights: { planSpontaneous: -2 } },
			{ id: 'feel', label: 'Słucham intuicji', weights: { planSpontaneous: 2 } },
			{ id: 'compromise', label: 'Szukam kompromisu', weights: { boldSafe: -1, socialCozy: 1 } },
		],
	},
	{
		id: 'life-hobby-1',
		packId: 'lifestyle',
		prompt: 'Hobby: co Cię bardziej ładuje?',
		options: [
			{ id: 'creative', label: 'Kreatywne (tworzenie)', weights: { boldSafe: 1, minimalMaximal: 1 } },
			{ id: 'sport', label: 'Ruch / sport', weights: { boldSafe: 1, socialCozy: -1 } },
			{ id: 'knowledge', label: 'Wiedza / rozwój', weights: { planSpontaneous: -1, modernClassic: 1 } },
			{ id: 'rest', label: 'Odpoczynek', weights: { socialCozy: 2 } },
		],
	},
	{
		id: 'life-pace-1',
		packId: 'lifestyle',
		prompt: 'Tempo życia: co bardziej do Ciebie pasuje?',
		options: [
			{ id: 'slow', label: 'Slow (spokojnie)', weights: { socialCozy: 2, planSpontaneous: -1 } },
			{ id: 'balanced', label: 'Zbalansowane', weights: { socialCozy: 0 } },
			{ id: 'fast', label: 'Szybkie (dzieje się)', weights: { socialCozy: -2, planSpontaneous: 1 } },
			{ id: 'bursts', label: 'Zrywami (raz intensywnie, raz chill)', weights: { planSpontaneous: 2 } },
		],
	},
	{
		id: 'life-communication-1',
		packId: 'lifestyle',
		prompt: 'Gdy jest stres: wolisz…',
		options: [
			{ id: 'talk', label: 'Porozmawiać od razu', weights: { socialCozy: -1, planSpontaneous: -1 } },
			{ id: 'space', label: 'Chwilę ciszy i spokoju', weights: { socialCozy: 2 } },
			{ id: 'distract', label: 'Odwrócić uwagę aktywnością', weights: { planSpontaneous: 1 } },
			{ id: 'plan', label: 'Ustalić plan i działanie', weights: { planSpontaneous: -2 } },
		],
	},
	{
		id: 'life-home-feel-1',
		packId: 'lifestyle',
		prompt: 'Dom ma być bardziej…',
		options: [
			{ id: 'calm', label: 'Spokojny i kojący', weights: { socialCozy: 2, minimalMaximal: -1 } },
			{ id: 'stylish', label: 'Stylowy i „wow”', weights: { boldSafe: 2, minimalMaximal: 1 } },
			{ id: 'functional', label: 'Funkcjonalny', weights: { boldSafe: -1, planSpontaneous: -1 } },
			{ id: 'creative', label: 'Kreatywny i zmienny', weights: { planSpontaneous: 2, minimalMaximal: 1 } },
		],
	},
	{
		id: 'life-free-time-1',
		packId: 'lifestyle',
		prompt: 'W wolnym czasie częściej wybierasz…',
		options: [
			{ id: 'read', label: 'Czytanie / spokojne rzeczy', weights: { socialCozy: 2 } },
			{ id: 'learn', label: 'Nowe umiejętności', weights: { planSpontaneous: -1, modernClassic: 1 } },
			{ id: 'social', label: 'Spotkania / wyjścia', weights: { socialCozy: -2 } },
			{ id: 'random', label: '„Co wpadnie do głowy”', weights: { planSpontaneous: 2 } },
		],
	},
	{
		id: 'life-consumption-1',
		packId: 'lifestyle',
		prompt: 'Rzeczy: wolisz mieć…',
		options: [
			{ id: 'few', label: 'Mniej, ale dobrze dobrane', weights: { minimalMaximal: -2, budgetPremium: 1 } },
			{ id: 'many', label: 'Dużo i różnorodnie', weights: { minimalMaximal: 2 } },
			{ id: 'exper', label: 'Mniej rzeczy, więcej doświadczeń', weights: { minimalMaximal: -1, planSpontaneous: 1 } },
			{ id: 'practical', label: 'Tyle, ile potrzebuję', weights: { boldSafe: -1 } },
		],
	},
	{
		id: 'life-weekend-1',
		packId: 'lifestyle',
		prompt: 'Weekend: bardziej…',
		options: [
			{ id: 'plan', label: 'Plan (wiem, co robię)', weights: { planSpontaneous: -2 } },
			{ id: 'mix', label: 'Plan + luz', weights: { planSpontaneous: -1 } },
			{ id: 'spont', label: 'Spontan (co wyjdzie)', weights: { planSpontaneous: 3 } },
			{ id: 'rest', label: 'Odpoczynek (bez presji)', weights: { socialCozy: 2 } },
		],
	},
	{
		id: 'life-stuff-1',
		packId: 'lifestyle',
		prompt: 'Gdy kupujesz coś „większego”:',
		options: [
			{ id: 'safe', label: 'Wybieram bezpiecznie', weights: { boldSafe: -2, planSpontaneous: -1 } },
			{ id: 'best', label: 'Biorę najlepszą opcję (premium)', weights: { budgetPremium: 2, planSpontaneous: -1 } },
			{ id: 'smart', label: 'Szukam najlepszego value', weights: { budgetPremium: -1, planSpontaneous: -1 } },
			{ id: 'impulse', label: 'Zdarza się impuls', weights: { planSpontaneous: 2, boldSafe: 1 } },
		],
	},
];

const food: QuizQuestion[] = [
	{
		id: 'food-spice-1',
		packId: 'food',
		prompt: 'Jak z ostrym jedzeniem?',
		options: [
			{ id: 'love', label: 'Im ostrzej, tym lepiej', weights: { boldSafe: 2 } },
			{ id: 'some', label: 'Trochę ostrości jest OK', weights: { boldSafe: 0 } },
			{ id: 'no', label: 'Raczej nie lubię ostrego', weights: { boldSafe: -1 } },
			{ id: 'depends', label: 'Zależy od dania', weights: { planSpontaneous: 1 } },
		],
	},
	{
		id: 'food-type-1',
		packId: 'food',
		prompt: 'Wolisz jedzenie bardziej…',
		options: [
			{ id: 'comfort', label: 'Komfortowe i znane', weights: { boldSafe: -2, socialCozy: 1 } },
			{ id: 'new', label: 'Nowe smaki i eksperymenty', weights: { boldSafe: 2 } },
			{ id: 'healthy', label: 'Zdrowe i lekkie', weights: { minimalMaximal: -1, planSpontaneous: -1 } },
			{ id: 'indulgent', label: '„Dziś bez liczenia”', weights: { planSpontaneous: 2, budgetPremium: 1 } },
		],
	},
	{
		id: 'food-out-1',
		packId: 'food',
		prompt: 'Kolacja: najczęściej wybierasz…',
		options: [
			{ id: 'cook', label: 'Gotowanie w domu', weights: { socialCozy: 2, budgetPremium: -1 } },
			{ id: 'delivery', label: 'Dostawa', weights: { planSpontaneous: 2, budgetPremium: 0 } },
			{ id: 'restaurant', label: 'Restauracja', weights: { budgetPremium: 2, socialCozy: -1 } },
			{ id: 'simple', label: 'Coś prostego i szybko', weights: { minimalMaximal: -1, planSpontaneous: 1 } },
		],
	},
	{
		id: 'food-sweet-1',
		packId: 'food',
		prompt: 'Słodkie vs słone:',
		options: [
			{ id: 'sweet', label: 'Słodkie', weights: { boldSafe: 0 } },
			{ id: 'salty', label: 'Słone', weights: { boldSafe: 0 } },
			{ id: 'both', label: 'Oba', weights: { planSpontaneous: 1 } },
			{ id: 'depends', label: 'Zależy od dnia', weights: { planSpontaneous: 2 } },
		],
	},
	{
		id: 'food-breakfast-1',
		packId: 'food',
		prompt: 'Śniadanie: co wolisz?',
		options: [
			{ id: 'sweet', label: 'Na słodko', weights: { planSpontaneous: 0 } },
			{ id: 'savory', label: 'Na słono', weights: { planSpontaneous: 0 } },
			{ id: 'none', label: 'Raczej pomijam', weights: { planSpontaneous: 1 } },
			{ id: 'big', label: 'Solidne', weights: { socialCozy: 0 } },
		],
	},
	{
		id: 'food-coffee-1',
		packId: 'food',
		prompt: 'Kawa:',
		options: [
			{ id: 'black', label: 'Czarna', weights: { boldSafe: 0, minimalMaximal: -1 } },
			{ id: 'milk', label: 'Mleczna', weights: { socialCozy: 1 } },
			{ id: 'special', label: 'Warianty speciality', weights: { budgetPremium: 1, boldSafe: 1 } },
			{ id: 'no', label: 'Nie piję', weights: { boldSafe: 0 } },
		],
	},
	{
		id: 'food-diet-1',
		packId: 'food',
		prompt: 'Dieta / podejście do jedzenia:',
		options: [
			{ id: 'healthy', label: 'Zdrowo i lekko', weights: { minimalMaximal: -1, planSpontaneous: -1 } },
			{ id: 'balanced', label: 'Balans', weights: { planSpontaneous: 0 } },
			{ id: 'comfort', label: 'Komfortowe jedzenie', weights: { socialCozy: 1, boldSafe: -1 } },
			{ id: 'depends', label: 'Zależy od okresu', weights: { planSpontaneous: 2 } },
		],
	},
	{
		id: 'food-explore-1',
		packId: 'food',
		prompt: 'Nowe restauracje: jak często próbujesz?',
		options: [
			{ id: 'often', label: 'Często', weights: { boldSafe: 2, planSpontaneous: 1 } },
			{ id: 'sometimes', label: 'Czasem', weights: { boldSafe: 0 } },
			{ id: 'rare', label: 'Rzadko', weights: { boldSafe: -2, planSpontaneous: -1 } },
			{ id: 'only', label: 'Tylko sprawdzone miejsca', weights: { boldSafe: -3 } },
		],
	},
	{
		id: 'food-price-1',
		packId: 'food',
		prompt: 'Jedzenie na mieście: co wybierasz częściej?',
		options: [
			{ id: 'cheap', label: 'Tanie i szybkie', weights: { budgetPremium: -2, planSpontaneous: 1 } },
			{ id: 'value', label: 'Dobra jakość w rozsądnej cenie', weights: { budgetPremium: -1 } },
			{ id: 'premium', label: 'Lepsze miejsca, rzadziej', weights: { budgetPremium: 2 } },
			{ id: 'home', label: 'Wolę dom', weights: { socialCozy: 1, budgetPremium: -1 } },
		],
	},
	{
		id: 'food-dessert-1',
		packId: 'food',
		prompt: 'Deser po kolacji?',
		options: [
			{ id: 'yes', label: 'Tak!', weights: { planSpontaneous: 1 } },
			{ id: 'sometimes', label: 'Czasem', weights: { planSpontaneous: 0 } },
			{ id: 'no', label: 'Raczej nie', weights: { planSpontaneous: -1 } },
			{ id: 'fruit', label: 'Owoc / lekko', weights: { minimalMaximal: -1 } },
		],
	},
	{
		id: 'food-cook-style-1',
		packId: 'food',
		prompt: 'Gotowanie w domu: jaki styl?',
		options: [
			{ id: 'fast', label: 'Szybko i prosto', weights: { minimalMaximal: -1, planSpontaneous: 1 } },
			{ id: 'recipe', label: 'Przepisy i odmierzanie', weights: { planSpontaneous: -2 } },
			{ id: 'improv', label: 'Improwizacja', weights: { planSpontaneous: 3 } },
			{ id: 'together', label: 'Razem (rytuał)', weights: { socialCozy: 2 } },
		],
	},
	{
		id: 'food-meat-1',
		packId: 'food',
		prompt: 'Mięso vs rośliny:',
		options: [
			{ id: 'meat', label: 'Mięso', weights: { boldSafe: 0 } },
			{ id: 'mix', label: 'Mix', weights: { boldSafe: 0 } },
			{ id: 'plant', label: 'Raczej roślinnie', weights: { modernClassic: 0 } },
			{ id: 'depends', label: 'Zależy od dania', weights: { planSpontaneous: 1 } },
		],
	},
	{
		id: 'food-snacks-1',
		packId: 'food',
		prompt: 'Przekąski do filmu:',
		options: [
			{ id: 'salty', label: 'Słone (chipsy, nachosy)', weights: { planSpontaneous: 1 } },
			{ id: 'sweet', label: 'Słodkie', weights: { planSpontaneous: 1 } },
			{ id: 'healthy', label: 'Zdrowsze (owoce, orzechy)', weights: { planSpontaneous: -1 } },
			{ id: 'none', label: 'Bez', weights: { minimalMaximal: -1 } },
		],
	},
	{
		id: 'food-drinks-1',
		packId: 'food',
		prompt: 'Napoje do kolacji:',
		options: [
			{ id: 'water', label: 'Woda / soft', weights: { minimalMaximal: -1 } },
			{ id: 'wine', label: 'Wino', weights: { budgetPremium: 1, socialCozy: 1 } },
			{ id: 'beer', label: 'Piwo', weights: { socialCozy: 0 } },
			{ id: 'cocktail', label: 'Drink / koktajl', weights: { boldSafe: 1, budgetPremium: 1 } },
		],
	},
	{
		id: 'food-picky-1',
		packId: 'food',
		prompt: 'Jesteś wybredny/a?',
		options: [
			{ id: 'no', label: 'Nie, zjem prawie wszystko', weights: { boldSafe: 2 } },
			{ id: 'some', label: 'Trochę', weights: { boldSafe: 0 } },
			{ id: 'yes', label: 'Tak, mam swoje zasady', weights: { boldSafe: -2, planSpontaneous: -1 } },
			{ id: 'depends', label: 'Zależy od humoru', weights: { planSpontaneous: 2 } },
		],
	},
	{
		id: 'food-celebrate-1',
		packId: 'food',
		prompt: '„Świętowanie” jedzeniem to raczej…',
		options: [
			{ id: 'home', label: 'Domowy comfort', weights: { socialCozy: 2 } },
			{ id: 'restaurant', label: 'Dobra restauracja', weights: { budgetPremium: 2 } },
			{ id: 'trip', label: 'Wypad / street food', weights: { planSpontaneous: 2, boldSafe: 1 } },
			{ id: 'cook', label: 'Gotowanie „na wypasie”', weights: { planSpontaneous: -1, budgetPremium: 1 } },
		],
	},
	{
		id: 'food-portion-1',
		packId: 'food',
		prompt: 'Porcje:',
		options: [
			{ id: 'big', label: 'Duże', weights: { planSpontaneous: 1 } },
			{ id: 'small', label: 'Mniejsze, ale częściej', weights: { planSpontaneous: 0 } },
			{ id: 'share', label: 'Dzielenie się (tapas vibe)', weights: { socialCozy: -1, boldSafe: 1 } },
			{ id: 'depends', label: 'Zależy', weights: { planSpontaneous: 2 } },
		],
	},
	{
		id: 'food-timing-1',
		packId: 'food',
		prompt: 'Godzina kolacji:',
		options: [
			{ id: 'early', label: 'Wcześnie', weights: { planSpontaneous: -1 } },
			{ id: 'normal', label: 'Normalnie', weights: { planSpontaneous: 0 } },
			{ id: 'late', label: 'Późno', weights: { planSpontaneous: 1 } },
			{ id: 'random', label: 'Jak wyjdzie', weights: { planSpontaneous: 2 } },
		],
	},
	{
		id: 'food-spice-1',
		packId: 'food',
		prompt: 'Ostrość:',
		options: [
			{ id: 'no', label: 'Nie lubię ostrego', weights: { boldSafe: -2 } },
			{ id: 'little', label: 'Lekko', weights: { boldSafe: -1 } },
			{ id: 'yes', label: 'Lubię ostro', weights: { boldSafe: 1 } },
			{ id: 'extreme', label: 'Im ostrzej, tym lepiej', weights: { boldSafe: 2, planSpontaneous: 1 } },
		],
	},
	{
		id: 'food-sharing-1',
		packId: 'food',
		prompt: 'Dzielenie się jedzeniem:',
		options: [
			{ id: 'love', label: 'Tak, lubię próbować wszystkiego', weights: { socialCozy: -1, planSpontaneous: 1 } },
			{ id: 'sometimes', label: 'Czasem', weights: { socialCozy: 0 } },
			{ id: 'no', label: 'Raczej nie', weights: { socialCozy: 1 } },
			{ id: 'depends', label: 'Zależy od osoby', weights: { planSpontaneous: 1 } },
		],
	},
];

const activities: QuizQuestion[] = [
	{
		id: 'act-evening-1',
		packId: 'activities',
		prompt: 'Wieczór po pracy: co brzmi najlepiej?',
		options: [
			{ id: 'movie', label: 'Film/serial i chill', weights: { socialCozy: 2 } },
			{ id: 'walk', label: 'Spacer i rozmowa', weights: { socialCozy: 1, planSpontaneous: 1 } },
			{ id: 'game', label: 'Gra / planszówka', weights: { socialCozy: 0, boldSafe: 1 } },
			{ id: 'out', label: 'Wyjście (miasto, event)', weights: { socialCozy: -2, planSpontaneous: 1 } },
		],
	},
	{
		id: 'act-holiday-1',
		packId: 'activities',
		prompt: 'Wolne: bardziej…',
		options: [
			{ id: 'relax', label: 'Relaks (spa, leżing)', weights: { socialCozy: 2 } },
			{ id: 'active', label: 'Aktywnie (sport, góry)', weights: { socialCozy: -1, boldSafe: 1 } },
			{ id: 'culture', label: 'Kultura (muzeum, koncert)', weights: { modernClassic: -1, planSpontaneous: -1 } },
			{ id: 'mixed', label: 'Mix: trochę tu, trochę tu', weights: { planSpontaneous: 1 } },
		],
	},
	{
		id: 'act-outdoor-1',
		packId: 'activities',
		prompt: 'Aktywności: wolisz indoor czy outdoor?',
		options: [
			{ id: 'out', label: 'Outdoor (natura)', weights: { naturalIndustrial: -1, planSpontaneous: 1 } },
			{ id: 'in', label: 'Indoor (wygoda)', weights: { socialCozy: 1 } },
			{ id: 'mix', label: 'Mix', weights: { planSpontaneous: 0 } },
			{ id: 'event', label: 'Eventy / miasto', weights: { socialCozy: -2 } },
		],
	},
	{
		id: 'act-sport-1',
		packId: 'activities',
		prompt: 'Sport: bliżej Ci do…',
		options: [
			{ id: 'none', label: 'Raczej nie', weights: { socialCozy: 1 } },
			{ id: 'light', label: 'Lekko (spacer/joga)', weights: { socialCozy: 1, boldSafe: -1 } },
			{ id: 'hard', label: 'Konkretnie (siłownia/trening)', weights: { boldSafe: 1, planSpontaneous: -1 } },
			{ id: 'season', label: 'Sezonowo', weights: { planSpontaneous: 1 } },
		],
	},
	{
		id: 'act-games-1',
		packId: 'activities',
		prompt: 'Gry (planszówki/komputer):',
		options: [
			{ id: 'love', label: 'Uwielbiam', weights: { socialCozy: 0, boldSafe: 1 } },
			{ id: 'sometimes', label: 'Czasem', weights: { socialCozy: 0 } },
			{ id: 'rare', label: 'Rzadko', weights: { boldSafe: -1 } },
			{ id: 'no', label: 'Nie moje', weights: { boldSafe: -2 } },
		],
	},
	{
		id: 'act-culture-1',
		packId: 'activities',
		prompt: 'Kultura: co wybierasz chętniej?',
		options: [
			{ id: 'cinema', label: 'Kino/teatr', weights: { modernClassic: 0, socialCozy: -1 } },
			{ id: 'museum', label: 'Muzea/wystawy', weights: { modernClassic: -1, planSpontaneous: -1 } },
			{ id: 'concert', label: 'Koncerty', weights: { socialCozy: -2, boldSafe: 1 } },
			{ id: 'none', label: 'Rzadko', weights: { socialCozy: 1 } },
		],
	},
	{
		id: 'act-relax-1',
		packId: 'activities',
		prompt: 'Relaks: co działa najlepiej?',
		options: [
			{ id: 'silence', label: 'Cisza i reset', weights: { socialCozy: 2 } },
			{ id: 'music', label: 'Muzyka', weights: { socialCozy: 1 } },
			{ id: 'talk', label: 'Rozmowa', weights: { socialCozy: -1 } },
			{ id: 'move', label: 'Ruch', weights: { planSpontaneous: 1 } },
		],
	},
	{
		id: 'act-date-1',
		packId: 'activities',
		prompt: 'Randka: co brzmi najbardziej „Wasze”?',
		options: [
			{ id: 'cozy', label: 'Domowo i przytulnie', weights: { socialCozy: 2 } },
			{ id: 'food', label: 'Nowe jedzenie na mieście', weights: { boldSafe: 1, budgetPremium: 1 } },
			{ id: 'active', label: 'Aktywnie (coś nowego)', weights: { boldSafe: 2, planSpontaneous: 1 } },
			{ id: 'culture', label: 'Kultura (kino/teatr)', weights: { modernClassic: 0 } },
		],
	},
	{
		id: 'act-holiday-style-1',
		packId: 'activities',
		prompt: 'Wakacje: bardziej…',
		options: [
			{ id: 'beach', label: 'Leżenie i plaża', weights: { socialCozy: 2 } },
			{ id: 'city', label: 'City break', weights: { socialCozy: -1, modernClassic: 1 } },
			{ id: 'nature', label: 'Natura i spokój', weights: { naturalIndustrial: -1, socialCozy: 1 } },
			{ id: 'adventure', label: 'Przygoda', weights: { boldSafe: 2, planSpontaneous: 2 } },
		],
	},
	{
		id: 'act-music-1',
		packId: 'activities',
		prompt: 'Muzyka w tle:',
		options: [
			{ id: 'always', label: 'Zawsze', weights: { minimalMaximal: 1, socialCozy: 0 } },
			{ id: 'sometimes', label: 'Czasem', weights: { minimalMaximal: 0 } },
			{ id: 'rare', label: 'Rzadko', weights: { minimalMaximal: -1 } },
			{ id: 'depends', label: 'Zależy od nastroju', weights: { planSpontaneous: 1 } },
		],
	},
	{
		id: 'act-reading-1',
		packId: 'activities',
		prompt: 'Czytanie:',
		options: [
			{ id: 'love', label: 'Uwielbiam', weights: { socialCozy: 2 } },
			{ id: 'sometimes', label: 'Czasem', weights: { socialCozy: 0 } },
			{ id: 'rare', label: 'Rzadko', weights: { socialCozy: -1 } },
			{ id: 'audio', label: 'Audiobooki/podcasty', weights: { modernClassic: 1 } },
		],
	},
	{
		id: 'act-movies-1',
		packId: 'activities',
		prompt: 'Filmy/seriale: jak oglądasz?',
		options: [
			{ id: 'binge', label: 'Binge (kilka odcinków)', weights: { planSpontaneous: 1 } },
			{ id: 'one', label: '1 odcinek i koniec', weights: { planSpontaneous: -1 } },
			{ id: 'cinema', label: 'Kino lub „event”, nie tło', weights: { budgetPremium: 1, planSpontaneous: -1 } },
			{ id: 'rare', label: 'Rzadko', weights: { socialCozy: 0 } },
		],
	},
	{
		id: 'act-party-1',
		packId: 'activities',
		prompt: 'Imprezy:',
		options: [
			{ id: 'yes', label: 'Tak', weights: { socialCozy: -3 } },
			{ id: 'sometimes', label: 'Czasem', weights: { socialCozy: -1 } },
			{ id: 'rare', label: 'Rzadko', weights: { socialCozy: 1 } },
			{ id: 'no', label: 'Nie', weights: { socialCozy: 3 } },
		],
	},
	{
		id: 'act-diy-1',
		packId: 'activities',
		prompt: 'DIY / majsterkowanie:',
		options: [
			{ id: 'love', label: 'Uwielbiam', weights: { boldSafe: 1, planSpontaneous: 1 } },
			{ id: 'sometimes', label: 'Czasem', weights: { boldSafe: 0 } },
			{ id: 'no', label: 'Nie', weights: { boldSafe: -1 } },
			{ id: 'learn', label: 'Chcę się nauczyć', weights: { boldSafe: 1, planSpontaneous: 0 } },
		],
	},
	{
		id: 'act-trips-1',
		packId: 'activities',
		prompt: 'Wypad na 1 dzień:',
		options: [
			{ id: 'plan', label: 'Z planem', weights: { planSpontaneous: -2 } },
			{ id: 'spont', label: 'Spontanicznie', weights: { planSpontaneous: 3 } },
			{ id: 'cozy', label: 'Spokojnie (kawiarnia, spacer)', weights: { socialCozy: 2 } },
			{ id: 'active', label: 'Aktywnie', weights: { boldSafe: 1 } },
		],
	},
	{
		id: 'act-new-1',
		packId: 'activities',
		prompt: 'Nowe hobby: jak podchodzisz?',
		options: [
			{ id: 'jump', label: 'Wskakuję od razu', weights: { boldSafe: 2, planSpontaneous: 2 } },
			{ id: 'research', label: 'Czytam i sprawdzam', weights: { planSpontaneous: -2 } },
			{ id: 'with', label: 'Najlepiej razem z kimś', weights: { socialCozy: -1 } },
			{ id: 'rare', label: 'Raczej zostaję przy swoich', weights: { boldSafe: -2 } },
		],
	},
	{
		id: 'act-relax-spend-1',
		packId: 'activities',
		prompt: 'Na relaks wydajesz raczej…',
		options: [
			{ id: 'low', label: 'Mało', weights: { budgetPremium: -2 } },
			{ id: 'some', label: 'Średnio', weights: { budgetPremium: 0 } },
			{ id: 'premium', label: 'Chętnie (premium relaks)', weights: { budgetPremium: 2 } },
			{ id: 'depends', label: 'Zależy od miesiąca', weights: { planSpontaneous: 1 } },
		],
	},
	{
		id: 'act-crowds-1',
		packId: 'activities',
		prompt: 'Tłumy:',
		options: [
			{ id: 'ok', label: 'OK', weights: { socialCozy: -2 } },
			{ id: 'sometimes', label: 'Czasem', weights: { socialCozy: -1 } },
			{ id: 'no', label: 'Nie lubię', weights: { socialCozy: 2 } },
			{ id: 'avoid', label: 'Unikam zawsze', weights: { socialCozy: 3 } },
		],
	},
	{
		id: 'act-night-1',
		packId: 'activities',
		prompt: 'Wieczór: bardziej…',
		options: [
			{ id: 'cozy', label: 'Koc, herbata, chill', weights: { socialCozy: 3 } },
			{ id: 'creative', label: 'Coś kreatywnego', weights: { minimalMaximal: 1, boldSafe: 1 } },
			{ id: 'out', label: 'Wyjście', weights: { socialCozy: -3 } },
			{ id: 'random', label: 'Cokolwiek – zależy', weights: { planSpontaneous: 2 } },
		],
	},
	{
		id: 'act-microadventure-1',
		packId: 'activities',
		prompt: 'Mikro-przygoda (coś nowego w mieście):',
		options: [
			{ id: 'yes', label: 'Tak!', weights: { boldSafe: 2, planSpontaneous: 2 } },
			{ id: 'sometimes', label: 'Czasem', weights: { boldSafe: 0 } },
			{ id: 'no', label: 'Raczej nie', weights: { boldSafe: -2 } },
			{ id: 'only', label: 'Tylko w dobrym towarzystwie', weights: { socialCozy: -1 } },
		],
	},
];

export const QUIZ_QUESTION_BANK: QuizQuestion[] = [...interiors, ...lifestyle, ...food, ...activities];

export function getQuestionById(id: string): QuizQuestion | null {
	return QUIZ_QUESTION_BANK.find((q) => q.id === id) ?? null;
}

export function getQuestionsByPack(packId: QuizPackId): QuizQuestion[] {
	if (packId === 'mix') return QUIZ_QUESTION_BANK;
	return QUIZ_QUESTION_BANK.filter((q) => q.packId === packId);
}

export function getAxisLabel(axisId: QuizAxisId): string {
	switch (axisId) {
		case 'modernClassic':
			return 'Nowoczesne ↔ Klasyczne';
		case 'minimalMaximal':
			return 'Minimalizm ↔ Maksymalizm';
		case 'warmCool':
			return 'Ciepłe ↔ Chłodne';
		case 'naturalIndustrial':
			return 'Naturalne ↔ Industrialne';
		case 'boldSafe':
			return 'Odważne ↔ Bezpieczne';
		case 'budgetPremium':
			return 'Oszczędnie ↔ Premium';
		case 'planSpontaneous':
			return 'Plan ↔ Spontaniczność';
		case 'socialCozy':
			return 'Towarzysko ↔ Kameralnie';
	}
}
