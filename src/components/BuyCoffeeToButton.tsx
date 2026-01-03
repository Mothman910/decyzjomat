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
			className={`inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 text-sm font-semibold text-white/90 backdrop-blur-xl ring-1 ring-white shadow-[0_0_14px_2px] shadow-orange-400/70 supports-[hover:hover]:hover:ring-white supports-[hover:hover]:hover:shadow-[0_0_18px_3px] supports-[hover:hover]:hover:shadow-orange-400/90 ${className ?? ''}`}
			style={{
				backgroundImage:
					'linear-gradient(90deg, rgba(131, 58, 180, 0.3) 0%, rgba(253, 29, 29, 0.3) 50%, rgba(252, 176, 69, 0.3) 100%)',
			}}
		>
			<Image
				src="/images/logo-sygnet.png"
				alt=""
				width={244}
				height={158}
				className="h-4 w-auto object-contain"
			/>
			<span className={imgClassName ?? ''}>Postaw kawę</span>
		</a>
	);
}
