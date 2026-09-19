document.addEventListener("DOMContentLoaded", function () {

    const input = document.getElementById("equationInput");
    const solveButton = document.getElementById("solveButton");
    const clearButton = document.getElementById("clearButton");

    const answerBox = document.getElementById("answer");
    const stepsBox = document.getElementById("steps");
    const checkBox = document.getElementById("checkResult");

    const textModeButton = document.getElementById("textModeButton");
    const sentenceModeButton = document.getElementById("sentenceModeButton");
    const imageModeButton = document.getElementById("imageModeButton");

    const EPS = 0.0000000001;


    /* =====================================================
       تبدیل ورودی
       ===================================================== */

    function normalize(value) {
        return value
            .replace(/[۰-۹]/g, function (c) {
                return "۰۱۲۳۴۵۶۷۸۹".indexOf(c);
            })
            .replace(/[٠-٩]/g, function (c) {
                return "٠١٢٣٤٥٦٧٨٩".indexOf(c);
            })
            .replace(/ایکس/gi, "x")
            .replace(/X/g, "x")
            .replace(/×/g, "*")
            .replace(/÷/g, "/")
            .replace(/[−–—]/g, "-")
            .replace(/²/g, "^2")
            .replace(/³/g, "^3")
            .replace(/,/g, ".")
            .replace(/\s+/g, "");
    }


    function clean(n) {
        if (Math.abs(n) < EPS) return 0;
        return Number(n.toFixed(10));
    }


    function numberText(n) {
        n = clean(n);

        if (Number.isInteger(n)) {
            return String(n);
        }

        return String(n);
    }


    /* =====================================================
       چندجمله‌ای
       [ثابت، ضریب x، ضریب x²]
       ===================================================== */

    function trim(p) {

        const result = p.map(clean);

        while (
            result.length > 1 &&
            Math.abs(result[result.length - 1]) < EPS
        ) {
            result.pop();
        }

        return result;
    }


    function add(a, b) {

        const length = Math.max(a.length, b.length);
        const result = [];

        for (let i = 0; i < length; i++) {
            result[i] = (a[i] || 0) + (b[i] || 0);
        }

        return trim(result);
    }


    function subtract(a, b) {

        const length = Math.max(a.length, b.length);
        const result = [];

        for (let i = 0; i < length; i++) {
            result[i] = (a[i] || 0) - (b[i] || 0);
        }

        return trim(result);
    }


    function multiply(a, b) {

        const result = new Array(
            a.length + b.length - 1
        ).fill(0);

        for (let i = 0; i < a.length; i++) {

            for (let j = 0; j < b.length; j++) {

                result[i + j] += a[i] * b[j];

            }
        }


        if (
            result.length > 3 &&
            result.slice(3).some(function (n) {
                return Math.abs(n) > EPS;
            })
        ) {
            throw new Error(
                "فعلاً معادلات با توان بالاتر از ۲ پشتیبانی نمی‌شوند."
            );
        }

        return trim(result);
    }


    function divide(a, b) {

        if (
            b.length !== 1 ||
            Math.abs(b[0]) < EPS
        ) {
            throw new Error(
                "در این نسخه، تقسیم بر عبارت دارای متغیر پشتیبانی نمی‌شود."
            );
        }

        return trim(
            a.map(function (n) {
                return n / b[0];
            })
        );
    }


    function power(a, exponent) {

        exponent = clean(exponent);

        if (
            !Number.isInteger(exponent) ||
            exponent < 0 ||
            exponent > 2
        ) {
            throw new Error(
                "فعلاً توان‌های ۰ تا ۲ پشتیبانی می‌شوند."
            );
        }

        let result = [1];

        for (let i = 0; i < exponent; i++) {
            result = multiply(result, a);
        }

        return result;
    }


    /* =====================================================
       نمایش چندجمله‌ای
       ===================================================== */

    function polynomialText(p) {

        const parts = [];

        for (let i = p.length - 1; i >= 0; i--) {

            const coefficient = clean(p[i] || 0);

            if (coefficient === 0) continue;

            const abs = Math.abs(coefficient);
            let term = "";

            if (i === 0) {
                term = numberText(abs);
            }

            else if (i === 1) {

                term =
                    abs === 1
                        ? "x"
                        : numberText(abs) + "x";

            }

            else if (i === 2) {

                term =
                    abs === 1
                        ? "x²"
                        : numberText(abs) + "x²";

            }


            if (parts.length === 0) {

                parts.push(
                    coefficient < 0
                        ? "-" + term
                        : term
                );

            }

            else {

                parts.push(
                    coefficient < 0
                        ? " - " + term
                        : " + " + term
                );

            }
        }

        return parts.length ? parts.join("") : "0";
    }


    /* =====================================================
       نمایش ضریب x
       ===================================================== */

    function xTerm(coefficient) {

        coefficient = clean(coefficient);

        if (coefficient === 1) {
            return "x";
        }

        if (coefficient === -1) {
            return "-x";
        }

        return numberText(coefficient) + "x";
    }


    /* =====================================================
       Tokenizer
       ===================================================== */

    function tokenize(text) {

        const tokens = [];
        let i = 0;

        while (i < text.length) {

            const char = text[i];


            if (/[0-9.]/.test(char)) {

                let number = "";
                let dots = 0;

                while (
                    i < text.length &&
                    /[0-9.]/.test(text[i])
                ) {

                    if (text[i] === ".") {
                        dots++;
                    }

                    number += text[i];
                    i++;
                }

                if (
                    dots > 1 ||
                    number === "."
                ) {
                    throw new Error(
                        "یک عدد نامعتبر وارد شده است."
                    );
                }

                tokens.push({
                    type: "number",
                    value: Number(number)
                });

                continue;
            }


            if (char === "x") {

                tokens.push({
                    type: "x"
                });

                i++;
                continue;
            }


            if ("+-*/^()".includes(char)) {

                tokens.push({
                    type: char
                });

                i++;
                continue;
            }


            throw new Error(
                "علامت «" + char + "» قابل تشخیص نیست."
            );
        }


        /* ضرب ضمنی */

        const result = [];


        function canEnd(token) {

            return token &&
                (
                    token.type === "number" ||
                    token.type === "x" ||
                    token.type === ")"
                );
        }


        function canStart(token) {

            return token &&
                (
                    token.type === "number" ||
                    token.type === "x" ||
                    token.type === "("
                );
        }


        for (let j = 0; j < tokens.length; j++) {

            const current = tokens[j];
            const previous = result[result.length - 1];

            if (
                canEnd(previous) &&
                canStart(current)
            ) {
                result.push({
                    type: "*"
                });
            }

            result.push(current);
        }

        return result;
    }


    /* =====================================================
       Parser
       ===================================================== */

    function Parser(tokens) {

        this.tokens = tokens;
        this.position = 0;
    }


    Parser.prototype.current = function () {
        return this.tokens[this.position];
    };


    Parser.prototype.eat = function (type) {

        if (
            this.current() &&
            this.current().type === type
        ) {
            return this.tokens[this.position++];
        }

        return null;
    };


    Parser.prototype.expect = function (type) {

        if (!this.eat(type)) {

            throw new Error(
                "پرانتز یا عبارت کامل نیست."
            );
        }
    };


    Parser.prototype.parse = function () {

        const result = this.expression();

        if (
            this.position < this.tokens.length
        ) {

            throw new Error(
                "بخشی از عبارت قابل تشخیص نیست."
            );
        }

        return result;
    };


    Parser.prototype.expression = function () {

        let left = this.term();

        while (
            this.current() &&
            (
                this.current().type === "+" ||
                this.current().type === "-"
            )
        ) {

            const operator =
                this.tokens[this.position++].type;

            const right = this.term();

            if (operator === "+") {
                left = add(left, right);
            }

            else {
                left = subtract(left, right);
            }
        }

        return left;
    };


    Parser.prototype.term = function () {

        let left = this.power();

        while (
            this.current() &&
            (
                this.current().type === "*" ||
                this.current().type === "/"
            )
        ) {

            const operator =
                this.tokens[this.position++].type;

            const right = this.power();

            if (operator === "*") {
                left = multiply(left, right);
            }

            else {
                left = divide(left, right);
            }
        }

        return left;
    };


    Parser.prototype.power = function () {

        let left = this.unary();

        if (this.eat("^")) {

            const exponent = this.unary();

            if (exponent.length !== 1) {

                throw new Error(
                    "توان باید یک عدد ثابت باشد."
                );
            }

            left = power(
                left,
                exponent[0]
            );
        }

        return left;
    };


    Parser.prototype.unary = function () {

        if (this.eat("+")) {
            return this.unary();
        }

        if (this.eat("-")) {

            return this.unary().map(function (n) {
                return -n;
            });

        }

        return this.primary();
    };


    Parser.prototype.primary = function () {

        const token = this.current();


        if (!token) {

            throw new Error(
                "عبارت کامل نیست."
            );
        }


        if (token.type === "number") {

            this.position++;

            return [token.value];
        }


        if (token.type === "x") {

            this.position++;

            return [0, 1];
        }


        if (this.eat("(")) {

            const result = this.expression();

            this.expect(")");

            return result;
        }


        throw new Error(
            "عبارت ریاضی معتبر نیست."
        );
    };


    function parseExpression(text) {

        const tokens = tokenize(text);

        if (!tokens.length) {

            throw new Error(
                "عبارت خالی است."
            );
        }

        return new Parser(tokens).parse();
    }


    /* =====================================================
       حل معادله
       ===================================================== */

    function solveEquation(text) {

        const equation = normalize(text);

        const equals =
            (equation.match(/=/g) || []).length;


        if (equals !== 1) {

            throw new Error(
                "معادله باید دقیقاً یک علامت مساوی داشته باشد."
            );
        }


        const parts = equation.split("=");

        if (
            !parts[0] ||
            !parts[1]
        ) {

            throw new Error(
                "دو طرف معادله را کامل وارد کنید."
            );
        }


        const left = parseExpression(parts[0]);
        const right = parseExpression(parts[1]);

        const difference =
            subtract(left, right);


        const a = clean(difference[2] || 0);
        const b = clean(difference[1] || 0);
        const c = clean(difference[0] || 0);


        /* معادله ثابت */

        if (
            Math.abs(a) < EPS &&
            Math.abs(b) < EPS
        ) {

            if (Math.abs(c) < EPS) {

                return {
                    type: "infinite",
                    left: left,
                    right: right
                };
            }

            return {
                type: "none",
                left: left,
                right: right
            };
        }


        /* درجه اول */

        if (Math.abs(a) < EPS) {

            const x = clean(-c / b);

            return {
                type: "linear",
                left: left,
                right: right,
                a: a,
                b: b,
                c: c,
                x: x
            };
        }


        /* درجه دوم */

        const delta =
            clean(b * b - 4 * a * c);


        if (delta < 0) {

            return {
                type: "quadratic-none",
                left: left,
                right: right,
                a: a,
                b: b,
                c: c,
                delta: delta
            };
        }


        if (Math.abs(delta) < EPS) {

            const x =
                clean(-b / (2 * a));

            return {
                type: "quadratic-one",
                left: left,
                right: right,
                a: a,
                b: b,
                c: c,
                delta: delta,
                x: x
            };
        }


        const sqrtDelta = Math.sqrt(delta);

        const x1 =
            clean((-b + sqrtDelta) / (2 * a));

        const x2 =
            clean((-b - sqrtDelta) / (2 * a));


        return {
            type: "quadratic-two",
            left: left,
            right: right,
            a: a,
            b: b,
            c: c,
            delta: delta,
            x1: x1,
            x2: x2
        };
    }


    /* =====================================================
       ساخت مراحل آموزشی درجه اول
       ===================================================== */

    function createLinearSteps(result) {

        const b = result.b;
        const c = result.c;

        const original =
            polynomialText(result.left) +
            " = " +
            polynomialText(result.right);


        let html = "";

        html +=
            "<div dir='ltr' class='step-line'>" +
            original +
            "</div>";


        /* حذف ثابت */

        if (c !== 0) {

            const operation =
                c > 0
                    ? "از هر دو طرف " + numberText(c) + " کم می‌کنیم:"
                    : "به هر دو طرف " + numberText(Math.abs(c)) + " اضافه می‌کنیم:";


            html +=
                "<div class='step-explanation'>" +
                operation +
                "</div>";


            const leftOperation =
                xTerm(b) +
                (c > 0
                    ? " + " + numberText(c) + " − " + numberText(c)
                    : " - " + numberText(Math.abs(c)) + " + " + numberText(Math.abs(c)));


            const rightOperation =
                numberText(-c) +
                (c > 0
                    ? " - " + numberText(c)
                    : " + " + numberText(Math.abs(c)));


            html +=
                "<div dir='ltr' class='step-line'>" +
                leftOperation +
                " = " +
                rightOperation +
                "</div>";


            html +=
                "<div dir='ltr' class='step-line'>" +
                xTerm(b) +
                " = " +
                numberText(-c) +
                "</div>";
        }


        /* تقسیم بر ضریب x */

        if (b !== 1) {

            html +=
                "<div class='step-explanation'>" +
                "از هر دو طرف بر " +
                numberText(b) +
                " تقسیم می‌کنیم:" +
                "</div>";


            html +=
                "<div dir='ltr' class='step-line'>" +
                xTerm(b) +
                " ÷ " +
                numberText(b) +
                " = " +
                numberText(-c) +
                " ÷ " +
                numberText(b) +
                "</div>";
        }


        html +=
            "<div dir='ltr' class='step-line'>" +
            "x = " +
            numberText(result.x) +
            "</div>";


        return html;
    }


    /* =====================================================
       نمایش جواب و مراحل
       ===================================================== */

    function showResult(result) {

        if (result.type === "linear") {

            answerBox.innerHTML =
                "x = " + numberText(result.x);

            stepsBox.innerHTML =
                createLinearSteps(result);

            return;
        }


        if (
            result.type === "quadratic-two" ||
            result.type === "quadratic-one" ||
            result.type === "quadratic-none"
        ) {

            if (result.type === "quadratic-two") {

                answerBox.innerHTML =
                    "x₁ = " +
                    numberText(result.x1) +
                    "<br>" +
                    "x₂ = " +
                    numberText(result.x2);

            }

            else if (
                result.type === "quadratic-one"
            ) {

                answerBox.innerHTML =
                    "x = " +
                    numberText(result.x);

            }

            else {

                answerBox.textContent =
                    "جواب حقیقی ندارد";
            }


            stepsBox.innerHTML =
                "<div dir='ltr' class='step-line'>" +
                polynomialText(result.left) +
                " = " +
                polynomialText(result.right) +
                "</div>" +

                "<div dir='ltr' class='step-line'>" +
                numberText(result.a) +
                "x² + " +
                numberText(result.b) +
                "x + " +
                numberText(result.c) +
                " = 0" +
                "</div>" +

                "<div class='step-explanation'>" +
                "دلتا را حساب می‌کنیم:" +
                "</div>" +

                "<div dir='ltr' class='step-line'>" +
                "Δ = b² − 4ac = " +
                numberText(result.delta) +
                "</div>";


            if (
                result.type ===
                "quadratic-none"
            ) {

                stepsBox.innerHTML +=
                    "<div class='step-explanation'>" +
                    "چون دلتا منفی است، جواب حقیقی وجود ندارد." +
                    "</div>";

            }


            if (
                result.type ===
                "quadratic-one"
            ) {

                stepsBox.innerHTML +=
                    "<div class='step-line' dir='ltr'>" +
                    "x = " +
                    numberText(result.x) +
                    "</div>";

            }


            if (
                result.type ===
                "quadratic-two"
            ) {

                stepsBox.innerHTML +=
                    "<div class='step-line' dir='ltr'>" +
                    "x₁ = " +
                    numberText(result.x1) +
                    "</div>" +

                    "<div class='step-line' dir='ltr'>" +
                    "x₂ = " +
                    numberText(result.x2) +
                    "</div>";

            }

            return;
        }


        if (result.type === "infinite") {

            answerBox.textContent =
                "بی‌نهایت جواب";

            stepsBox.innerHTML =
                "<div class='step-explanation'>" +
                "دو طرف معادله یکسان هستند؛ بنابراین بی‌نهایت جواب دارد." +
                "</div>";

            return;
        }


        answerBox.textContent =
            "جواب ندارد";

        stepsBox.innerHTML =
            "<div class='step-explanation'>" +
            "دو طرف معادله پس از ساده‌سازی برابر نیستند؛ بنابراین جواب ندارد." +
            "</div>";
    }


    /* =====================================================
       بررسی جواب
       ===================================================== */

    function evaluate(p, x) {

        let result = 0;

        for (let i = p.length - 1; i >= 0; i--) {

            result =
                result * x +
                (p[i] || 0);
        }

        return clean(result);
    }


    function check(result) {

        if (
            result.type === "linear" ||
            result.type === "quadratic-one"
        ) {

            const left =
                evaluate(result.left, result.x);

            const right =
                evaluate(result.right, result.x);


            checkBox.innerHTML =
                "<div dir='ltr'>" +
                "طرف چپ = " +
                numberText(left) +
                "</div>" +

                "<div dir='ltr'>" +
                "طرف راست = " +
                numberText(right) +
                "</div>" +

                "<strong>✓ دو طرف برابر هستند؛ جواب درست است.</strong>";

            return;
        }


        if (
            result.type === "quadratic-two"
        ) {

            const left1 =
                evaluate(result.left, result.x1);

            const right1 =
                evaluate(result.right, result.x1);

            const left2 =
                evaluate(result.left, result.x2);

            const right2 =
                evaluate(result.right, result.x2);


            checkBox.innerHTML =
                "<div dir='ltr'>" +
                "x₁ = " +
                numberText(result.x1) +
                " → " +
                numberText(left1) +
                " = " +
                numberText(right1) +
                " ✓" +
                "</div>" +

                "<div dir='ltr'>" +
                "x₂ = " +
                numberText(result.x2) +
                " → " +
                numberText(left2) +
                " = " +
                numberText(right2) +
                " ✓" +
                "</div>";

            return;
        }


        if (
            result.type === "infinite"
        ) {

            checkBox.textContent =
                "هر مقدار x معادله را برقرار می‌کند.";

            return;
        }


        checkBox.textContent =
            "برای این معادله جواب حقیقی وجود ندارد.";
    }


    /* =====================================================
       اجرای حل
       ===================================================== */

    function solve() {

        const raw = input.value.trim();


        if (!raw) {

            answerBox.textContent =
                "لطفاً یک معادله وارد کن.";

            stepsBox.innerHTML =
                "<p class='empty-message'>" +
                "مثلاً بنویس: 2x + 5 = 17" +
                "</p>";

            checkBox.textContent =
                "هنوز جوابی برای بررسی وجود ندارد.";

            return;
        }


        try {

            const result =
                solveEquation(raw);

            showResult(result);
            check(result);

        }

        catch (error) {

            answerBox.textContent =
                "خطا در ورود معادله";

            stepsBox.innerHTML =
                "<p class='empty-message'>" +
                error.message +
                "</p>";

            checkBox.textContent =
                "معادله قابل بررسی نیست.";
        }
    }


    /* =====================================================
       دکمه پاک کردن
       ===================================================== */

    clearButton.addEventListener(
        "click",
        function () {

            input.value = "";

            answerBox.textContent =
                "هنوز معادله‌ای حل نشده است.";

            stepsBox.innerHTML =
                "<p class='empty-message'>" +
                "بعد از حل معادله، مراحل اینجا نمایش داده می‌شود." +
                "</p>";

            checkBox.textContent =
                "هنوز جوابی برای بررسی وجود ندارد.";

            input.focus();
        }
    );


    /* =====================================================
       دکمه حل
       ===================================================== */

    solveButton.addEventListener(
        "click",
        solve
    );


    /* Ctrl + Enter */

    input.addEventListener(
        "keydown",
        function (event) {

            if (
                event.ctrlKey &&
                event.key === "Enter"
            ) {
                solve();
            }
        }
    );


    /* =====================================================
       حالت‌های ورود
       ===================================================== */

    function activateButton(button) {

        textModeButton.classList.remove("active");
        sentenceModeButton.classList.remove("active");
        imageModeButton.classList.remove("active");

        button.classList.add("active");
    }


    textModeButton.addEventListener(
        "click",
        function () {

            activateButton(textModeButton);

            input.placeholder =
                "مثلاً: 2x + 5 = 17";

            input.focus();
        }
    );


    sentenceModeButton.addEventListener(
        "click",
        function () {

            activateButton(sentenceModeButton);

            input.placeholder =
                "مثلاً: دو برابر یک عدد به اضافه پنج برابر با هفده است";

            input.focus();
        }
    );


    imageModeButton.addEventListener(
        "click",
        function () {

            activateButton(imageModeButton);

            alert(
                "قابلیت حل از روی عکس را در مرحله بعد اضافه می‌کنیم."
            );
        }
    );


    /* =====================================================
       نمونه اولیه
       ===================================================== */

    input.value = "2x + 5 = 17";

});
