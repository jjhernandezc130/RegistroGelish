
(function () {
    const carousels = document.querySelectorAll('.kl-carousel');

    carousels.forEach(carousel => {
        const track = carousel.querySelector('.kl-track');
        const slides = Array.from(carousel.querySelectorAll('.kl-slide'));
        const nextBtn = carousel.querySelector('.kl-next');
        const prevBtn = carousel.querySelector('.kl-prev');

        if (!track || !slides.length) return;

        let index = 0;
        let startX = 0;
        let isDragging = false;

        function getVisibleCount() {
            const w = window.innerWidth;
            if (w >= 1200) return 4;
            if (w >= 768) return 3;
            return 1;
        }

        function getMaxIndex() {
            const visible = getVisibleCount();
            // Escritorio: permitimos un paso extra para revelar texto del último slide
            if (window.innerWidth >= 1200) {
                return Math.max(0, slides.length - visible + 1);
            }
            return Math.max(0, slides.length - visible);
        }

        function update() {
            const maxIndex = getMaxIndex();
            if (index > maxIndex) index = maxIndex;
            if (index < 0) index = 0;

            if (prevBtn) prevBtn.classList.toggle('visible', index > 0);
            if (nextBtn) {
                const atEnd = index >= maxIndex;
                nextBtn.style.opacity = atEnd ? '0' : '1';
                nextBtn.style.pointerEvents = atEnd ? 'none' : 'auto';
            }

            slides.forEach((s, i) => s.classList.toggle('active', i === index));
            const slideWidth = slides[0].offsetWidth;
            const gap = parseInt(getComputedStyle(track).gap) || 0;
            track.style.transform = `translateX(${-(slideWidth + gap) * index}px)`;
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (index < getMaxIndex()) index++;
                update();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (index > 0) index--;
                update();
            });
        }

        /* TAP: solo cambia tarjeta activa en móvil (MÓVIL) */
        slides.forEach((slide, i) => {
            slide.addEventListener('touchend', () => {
                index = i;
                update();
            }, { passive: true });
        });

        track.addEventListener('touchstart', e => {
            startX = e.touches[0].clientX;
            isDragging = true;
        }, { passive: true });

        track.addEventListener('touchend', e => {
            if (!isDragging) return;
            const diff = startX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) {
                if (diff > 0 && index < getMaxIndex()) index++;
                if (diff < 0 && index > 0) index--;
                update();
            }
            isDragging = false;
        }, { passive: true });

        //Update on resize to handle different visible counts
        window.addEventListener('resize', update);

        update();
    });
})();
