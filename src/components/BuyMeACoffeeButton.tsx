
type BuyMeACoffeeButtonProps = {
	className?: string;
	label?: string;
};

export function BuyMeACoffeeButton(props: BuyMeACoffeeButtonProps) {
	const { className, label = 'Postaw kawę' } = props;

	return (
		<a
			href="https://www.buymeacoffee.com/fijalkowsks"
			target="_blank"
			rel="noreferrer noopener"
			className={
				className ??
					'inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-white/15 px-4 text-sm font-semibold text-white transition-colors supports-[hover:hover]:hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
			}
		>
			{label}
		</a>
	);
}
