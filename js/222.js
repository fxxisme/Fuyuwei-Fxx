'use strict';

(function () {
    var canvasEl = document.querySelector('.fireworks');

    if (!canvasEl || typeof anime === 'undefined') {
        return;
    }

    var ctx = canvasEl.getContext('2d');
    var numberOfParticules = 30;
    var pointerX = 0;
    var pointerY = 0;
    var colors = ['#FF1461', '#18FF92', '#5A87FF', '#FBF38C'];

    function getEventPoint(e) {
        return e.touches && e.touches.length ? e.touches[0] : e;
    }

    function updateCoords(e) {
        var point = getEventPoint(e);
        var rect = canvasEl.getBoundingClientRect();

        pointerX = point.clientX - rect.left;
        pointerY = point.clientY - rect.top;
    }

    function setParticuleDirection(particule) {
        var angle = (anime.random(0, 360) * Math.PI) / 180;
        var distance = anime.random(50, 180);
        var direction = [-1, 1][anime.random(0, 1)] * distance;

        return {
            x: particule.x + direction * Math.cos(angle),
            y: particule.y + direction * Math.sin(angle),
        };
    }

    function createParticule(x, y) {
        var particule = {};

        particule.x = x;
        particule.y = y;
        particule.color = colors[anime.random(0, colors.length - 1)];
        particule.radius = anime.random(16, 32);
        particule.endPos = setParticuleDirection(particule);
        particule.draw = function () {
            ctx.beginPath();
            ctx.arc(particule.x, particule.y, particule.radius, 0, 2 * Math.PI, true);
            ctx.fillStyle = particule.color;
            ctx.fill();
        };

        return particule;
    }

    function createCircle(x, y) {
        var circle = {};

        circle.x = x;
        circle.y = y;
        circle.color = '#F00';
        circle.radius = 0.1;
        circle.alpha = 0.5;
        circle.lineWidth = 6;
        circle.draw = function () {
            ctx.globalAlpha = circle.alpha;
            ctx.beginPath();
            ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI, true);
            ctx.lineWidth = circle.lineWidth;
            ctx.strokeStyle = circle.color;
            ctx.stroke();
            ctx.globalAlpha = 1;
        };

        return circle;
    }

    function renderParticule(anim) {
        for (var i = 0; i < anim.animatables.length; i++) {
            anim.animatables[i].target.draw();
        }
    }

    function animateParticules(x, y) {
        var circle = createCircle(x, y);
        var particules = [];

        for (var i = 0; i < numberOfParticules; i++) {
            particules.push(createParticule(x, y));
        }

        anime
            .timeline()
            .add({
                targets: particules,
                x: function (particule) {
                    return particule.endPos.x;
                },
                y: function (particule) {
                    return particule.endPos.y;
                },
                radius: 0.1,
                duration: anime.random(1200, 1800),
                easing: 'easeOutExpo',
                update: renderParticule,
            })
            .add({
                targets: circle,
                radius: anime.random(80, 160),
                lineWidth: 0,
                alpha: {
                    value: 0,
                    easing: 'linear',
                    duration: anime.random(600, 800),
                },
                duration: anime.random(1200, 1800),
                easing: 'easeOutExpo',
                update: renderParticule,
                offset: 0,
            });
    }

    function debounce(fn, delay) {
        var timer;

        return function () {
            var context = this;
            var args = arguments;

            clearTimeout(timer);
            timer = setTimeout(function () {
                fn.apply(context, args);
            }, delay);
        };
    }

    var setCanvasSize = debounce(function () {
        canvasEl.width = 2 * window.innerWidth;
        canvasEl.height = 2 * window.innerHeight;
        canvasEl.style.width = window.innerWidth + 'px';
        canvasEl.style.height = window.innerHeight + 'px';
        ctx.setTransform(2, 0, 0, 2, 0, 0);
    }, 500);

    var render = anime({
        duration: Infinity,
        update: function () {
            ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        },
    });

    function shouldIgnoreTarget(target) {
        return target.id === 'sidebar' || target.id === 'toggle-sidebar' || target.nodeName === 'A' || target.nodeName === 'IMG';
    }

    function handlePointer(e) {
        if (shouldIgnoreTarget(e.target)) {
            return;
        }

        render.play();
        updateCoords(e);
        animateParticules(pointerX, pointerY);
    }

    document.addEventListener('mousedown', handlePointer, false);
    document.addEventListener('touchstart', handlePointer, false);
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize, false);
})();
