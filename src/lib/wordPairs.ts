export type WordPairsSubcategoryId = 'adjectives' | 'animals' | 'textures';

export type WordPair = {
	left: string;
	right: string;
};

export const WORD_PAIRS_SUBCATEGORIES: Array<{ id: WordPairsSubcategoryId; label: string; pairs: WordPair[] }> = [
	{
		id: 'adjectives',
		label: 'Przymiotniki',
		pairs: [
			{ left: 'Puszysty', right: 'Gładki' },
			{ left: 'Twardy', right: 'Miękki' },
			{ left: 'Dziki', right: 'Udomowiony' },
			{ left: 'Spontaniczny', right: 'Zaplanowany' },
			{ left: 'Słodki', right: 'Pikantny' },
			{ left: 'Cichy', right: 'Głośny' },
			{ left: 'Klasyczny', right: 'Nowoczesny' },
			{ left: 'Minimalistyczny', right: 'Bogaty' },
			{ left: 'Romantyczny', right: 'Zadziorny' },
			{ left: 'Wyluzowany', right: 'Ambitny' },
			{ left: 'Wytworny', right: 'Swobodny' },
			{ left: 'Realistyczny', right: 'Baśniowy' },
			{ left: 'Lekki', right: 'Ciężki' },
			{ left: 'Szybki', right: 'Powolny' },
			{ left: 'Zabawny', right: 'Poważny' },
			{ left: 'Ryzykowny', right: 'Bezpieczny' },
		],
	},
	{
		id: 'animals',
		label: 'Zwierzęta',
		pairs: [
			{ left: 'Kot', right: 'Pies' },
			{ left: 'Lis', right: 'Wilk' },
			{ left: 'Sowa', right: 'Skowronek' },
			{ left: 'Delfin', right: 'Rekin' },
			{ left: 'Żółw', right: 'Zając' },
			{ left: 'Panda', right: 'Tygrys' },
			{ left: 'Koń', right: 'Jednorożec' },
			{ left: 'Wróbel', right: 'Orzeł' },
			{ left: 'Jeż', right: 'Królik' },
			{ left: 'Bóbr', right: 'Wydra' },
			{ left: 'Pingwin', right: 'Flaming' },
			{ left: 'Niedźwiedź', right: 'Sarna' },
			{ left: 'Mors', right: 'Foka' },
			{ left: 'Kameleon', right: 'Papuga' },
			{ left: 'Wąż', right: 'Jaszczurka' },
			{ left: 'Mrówka', right: 'Konik polny' },
		],
	},
	{
		id: 'textures',
		label: 'Tekstury',
		pairs: [
			{ left: 'Chrupiący', right: 'Kremowy' },
			{ left: 'Ciepły', right: 'Chłodny' },
			{ left: 'Matowy', right: 'Błyszczący' },
			{ left: 'Szorstki', right: 'Jedwabisty' },
			{ left: 'Suchy', right: 'Soczysty' },
			{ left: 'Kanciasty', right: 'Obły' },
			{ left: 'Ziarnisty', right: 'Gładki' },
			{ left: 'Mięsisty', right: 'Lekki' },
			{ left: 'Sypki', right: 'Kleisty' },
			{ left: 'Puchaty', right: 'Lśniący' },
			{ left: 'Kruchy', right: 'Sprężysty' },
			{ left: 'Delikatny', right: 'Wyrazisty' },
			{ left: 'Wibrujący', right: 'Spokojny' },
			{ left: 'Gęsty', right: 'Rzadki' },
			{ left: 'Gorący', right: 'Zimny' },
			{ left: 'Aksamitny', right: 'Metaliczny' },
		],
	},
];

export function getWordPairsSubcategory(id: WordPairsSubcategoryId) {
	return WORD_PAIRS_SUBCATEGORIES.find((s) => s.id === id) ?? WORD_PAIRS_SUBCATEGORIES[0];
}
