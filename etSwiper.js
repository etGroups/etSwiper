export class etSwiper {
	constructor(selector, options) {
		this.swipers = [];
		this.options = options;
		this.breakpoint = 0, this.screenWidth = 0;
		this.slideWidth = 0;
		this.translateX = 0;
		this.breakpointKeys = Object.keys(options.breakpoints).map(key => parseInt(key));
		this.nextSlideInterval;

		for (const swiper of document.querySelectorAll(selector)) {
			swiper.querySelector('.swiper-slide').classList.add('swiper-slide-active');
			this.swipers.push(swiper);
		}

		this.run();
	}

	switchBreakpoint(swiper) {
		this.setBreakpoint();

		window.addEventListener('resize', () => {
			this.setBreakpoint();
			swiper.querySelectorAll('.swiper-slide-duplicate').forEach(duplicate => duplicate.remove());
			this.render(swiper);
		});
	}

	setBreakpoint() {
		this.screenWidth = window.innerWidth;
		let newBreakpoint = 0;

		for (const breakpoint of this.breakpointKeys) {
			if (breakpoint <= this.screenWidth) {
				newBreakpoint = breakpoint;
			}
		}

		if (newBreakpoint !== this.breakpoint) {
			this.breakpoint = newBreakpoint;
		}
	}

	render(swiper) {
		const slidesPerView = this?.options?.breakpoints[this.breakpoint]?.slidesPerView ?? 1;
		this.slideWidth = swiper.offsetWidth / slidesPerView;

		let slides = swiper.querySelectorAll('.swiper-slide');
		if (slidesPerView > 1) {
			const howMany = Math.floor(slidesPerView / 2);
			for (let i = 0; i < howMany; i++) {
				let duplicate = slides[i].cloneNode(true);
				duplicate.classList.add('swiper-slide-duplicate');
				duplicate.classList.remove('swiper-slide-active');
				swiper.querySelector('.swiper-wrapper').appendChild(duplicate);
			}
			const lastIndex = slides.length;
			for (let i = lastIndex - howMany; i < lastIndex; i++) {
				let duplicate = slides[i].cloneNode(true);
				duplicate.classList.add('swiper-slide-duplicate');
				duplicate.classList.remove('swiper-slide-active');
				swiper.querySelector('.swiper-wrapper').insertBefore(duplicate, slides[0]);
			}
		}

		slides = swiper.querySelectorAll('.swiper-slide');
		for (const slide of slides) {
			slide.style.width = this.slideWidth + 'px';
		}

		swiper.querySelector('.swiper-wrapper').style.transform = 'translate(0px, 0px)';
	}

	genBullets(swiper) {
		let bullets = '';
		for (let i = 0; i < swiper.querySelectorAll('.swiper-slide').length; i++) {
			bullets += `<span class="swiper-pagination-bullet" role="button" aria-label="Go to slide ${i + 1}" index="${i}"></span>`;
		}

		swiper.querySelector('.swiper-pagination').innerHTML = bullets;
		swiper.querySelector('.swiper-pagination-bullet').classList.add('swiper-pagination-bullet-active');
	}

	run() {
		for (const swiper of this.swipers) {
			this.switchBreakpoint(swiper);
			this.genBullets(swiper);
			this.render(swiper);
			this.handleBullet(swiper);
			this.handleSwipe(swiper);
		}

		this.nextSlideInterval = setInterval(() => {
			this.nextSlide();
		}, this.options.autoplay.delay);
	}

	handleSwipe(swiper) {
		let isSwipe = false;
		let touchList = [];
		let newSlideActive = 0;

		const wrapper = swiper.querySelector('.swiper-wrapper');
		const bullets = swiper.querySelectorAll('.swiper-pagination-bullet');
		const slides = swiper.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)');
		const howManySlides = slides.length;
		const slideWidth = parseInt(swiper.querySelector('.swiper-slide').style.width);
		const transitionDuration = this.options.speed;

		for (const event of ['touchstart', 'mousedown']) {
			swiper.addEventListener(event, e => {
				isSwipe = true;
				touchList.push(e.pageX ?? e.touches[0].pageX);
				wrapper.style.transitionDuration = '0ms';
			}, {passive: true})
		}

		for (const event of ['touchmove', 'mousemove']) {
			swiper.addEventListener(event, function (e) {
				clearInterval(this.nextSlideInterval);
				this.nextSlideInterval = setInterval(() => {
					this.nextSlide();
				}, this.options.autoplay.delay);
				
				if (isSwipe) {
					touchList.push(parseFloat(e.pageX ?? e.touches[0].pageX));

					const diffX = touchList[touchList.length - 1] - touchList[touchList.length - 2];

					let translateX = parseFloat(wrapper.style.transform.replace(/(translate\(|, .*)/g, ''));
					const newX = translateX + diffX;
					wrapper.style.transform = `translate(${newX}px, 0px)`;

					newSlideActive = Math.round(-(newX / slideWidth));
					if (newSlideActive < 0) {
						newSlideActive = 0;
					} else if (newSlideActive >= howManySlides) {
						newSlideActive = howManySlides - 1;
					}

					swiper.querySelector('.swiper-slide-active').classList.remove('swiper-slide-active');
					slides[newSlideActive].classList.add('swiper-slide-active');
					swiper.querySelector('.swiper-pagination-bullet-active').classList.remove('swiper-pagination-bullet-active');
					bullets[newSlideActive].classList.add('swiper-pagination-bullet-active');
				}
			}.bind(this), {passive: true});
		}

		for (const event of ['touchend', 'mouseup']) {
			swiper.addEventListener(event, () => {
				isSwipe = false;
				touchList = [];

				wrapper.style.transitionDuration = `${transitionDuration}ms`;
				wrapper.style.transform = `translate(${-slideWidth * newSlideActive}px, 0px)`;
			}, {passive: true});
		}
	}

	handleBullet(swiper) {
		for (const bullet of swiper.querySelectorAll('.swiper-pagination-bullet')) {
			bullet.addEventListener('click', () => {
				swiper.querySelector('.swiper-pagination-bullet-active').classList.remove('swiper-pagination-bullet-active');
				bullet.classList.add('swiper-pagination-bullet-active');

				const index = bullet.getAttribute('index');
				this.translateX = -this.slideWidth * index;
				swiper.querySelector('.swiper-wrapper').style = `transition-duration: ${this.options.speed}ms; transform: translate(${this.translateX}px, 0px)`;

				swiper.querySelector('.swiper-slide-active').classList.remove('swiper-slide-active');
				swiper.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)')[index].classList.add('swiper-slide-active');
			});
		}
	}

	nextSlide() {
		for (const swiper of this.swipers) {
			let nextSlide = swiper.querySelector('.swiper-slide-active + .swiper-slide:not(.swiper-slide-duplicate)');
			let nextBullet = swiper.querySelector('.swiper-pagination-bullet-active + .swiper-pagination-bullet');
			if (nextSlide) {
				this.translateX -= this.slideWidth;
				nextSlide.classList.add('swiper-slide-active');
				swiper.querySelector('.swiper-slide-active').classList.remove('swiper-slide-active');
				swiper.querySelector('.swiper-wrapper').style = `transition-duration: ${this.options.speed}ms; transform: translate(${this.translateX}px, 0px)`;
				nextBullet.classList.add('swiper-pagination-bullet-active');
				swiper.querySelector('.swiper-pagination-bullet-active').classList.remove('swiper-pagination-bullet-active');
			} else {
				this.translateX = 0;
				swiper.querySelector('.swiper-slide-active').classList.remove('swiper-slide-active');
				swiper.querySelector('.swiper-slide:not(.swiper-slide-duplicate)').classList.add('swiper-slide-active');
				swiper.querySelector('.swiper-wrapper').style = `transition-duration: ${this.options.speed}ms; transform: translate(0px, 0px)`;
				swiper.querySelector('.swiper-pagination-bullet-active').classList.remove('swiper-pagination-bullet-active');
				swiper.querySelector('.swiper-pagination-bullet').classList.add('swiper-pagination-bullet-active');
			}
		}
	}
}