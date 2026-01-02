import Image from 'next/image';

type BuyCoffeeToButtonProps = {
	className?: string;
	imgClassName?: string;
};

export function BuyCoffeeToButton(props: BuyCoffeeToButtonProps) {
	const { className, imgClassName = 'h-12' } = props;

	return (
		<a
			href="https://buycoffee.to/mothman910"
			target="_blank"
			rel="noreferrer noopener"
			aria-label="Postaw kawę na buycoffee.to"
			title="Postaw kawę"
			className={`inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 p-px shadow-[0_0_12px_2px] shadow-orange-400/50 transition-shadow hover:shadow-orange-400/70 ${className ?? ''}`}
		>
			<span
				className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500/10 via-orange-500/20 to-rose-500/10 px-4 text-sm font-semibold text-white backdrop-blur-sm ${imgClassName ?? ''}`}
			>
				<Image
					src="/images/logo-sygnet.png"
					alt=""
					width={244}
					height={158}
					className="h-4 w-auto object-contain"
				/>
				Postaw kawę
			</span>
		</a>
	);
}
