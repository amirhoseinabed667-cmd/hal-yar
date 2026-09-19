document.addEventListener("DOMContentLoaded", function () {

    // =========================
    // گرفتن عناصر صفحه
    // =========================

    const equationInput = document.getElementById("equationInput");
    const solveButton = document.getElementById("solveButton");
    const clearButton = document.getElementById("clearButton");

    const answer = document.getElementById("answer");
    const steps = document.getElementById("steps");
    const checkResult = document.getElementById("checkResult");

    const textModeButton = document.getElementById("textModeButton");
    const sentenceModeButton = document.getElementById("sentenceModeButton");
    const imageModeButton = document.getElementById("imageModeButton");


    // =========================
    // تبدیل اعداد فارسی به انگلیسی
    // =========================

    function normalizeNumbers(text) {
        if (!text) return "";

        const persianNumbers = "۰۱۲۳۴۵۶۷۸۹";
        const arabicNumbers = "٠١٢٣٤٥٦٧٨٩";

        return text
            .replace(/[۰-۹]/g, function (char) {
                return persianNumbers.indexOf(char);
            })
            .replace(/[٠-٩]/g, function (char) {
                return arabicNumbers.indexOf(char);
            })
            .replace(/٫/g, ".")
            .replace(/،/g, ",")
            .replace(/×/g, "*")
            .replace(/−/g, "-")
            .replace(/÷/g, "/");
    }


    // =========================
    // فرمت نمایش عدد
    // =========================

    function formatNumber(num) {
        if (!Number.isFinite(num)) return String(num);

        if (Math.abs(num) < 0.0000000001) {
            num = 0;
        }

        if (Number.isInteger(num)) {
            return String(num);
        }

        return Number(num.toFixed(10)).toString();
    }


    // =========================
    // تبدیل عبارت‌های ساده به متن
    // =========================

    function xTerm(coefficient) {

        if (coefficient === 0) {
            return "0";
        }

        if (coefficient === 1) {
            return "x";
        }

        if (coefficient === -1) {
            return "-x";
        }

        return formatNumber(coefficient) + "x";
    }


    function equationText(a, b, c) {

        let left = "";

        if (a !== 0) {
            left += xTerm(a);
        }

        if (b !== 0) {

            if (left !== "") {
                if (b > 0) {
                    left += " + " + formatNumber(b);
                } else {
                    left += " - " + formatNumber(Math.abs(b));
                }
            } else {
                left = formatNumber(b);
            }

        }

        if (left === "") {
            left = "0";
        }

        return left + " = " + formatNumber(c);
    }


    // =========================
    // جدا کردن جمله‌های عبارت
    // =========================

    function splitTerms(expression) {

        expression = expression
            .replace(/\s+/g, "")
            .replace(/\*/g, "");

        if (expression === "") {
            return [];
        }

        if (expression[0] !== "+" && expression[0] !== "-") {
            expression = "+" + expression;
        }

        const terms = [];
        let current = "";

        for (let i = 0; i < expression.length; i++) {

            const char = expression[i];

            if (
                (char === "+" || char === "-") &&
                i !== 0
            ) {

                if (current !== "") {
                    terms.push(current);
                }

                current = char;

            } else {

                current += char;
            }
        }

        if (current !== "") {
            terms.push(current);
        }

        return terms;
    }


    // =========================
    // ضرب یک جمله در عدد
    // =========================

    function multiplyTerm(term, factor) {

        term = term.replace(/\s+/g, "");

        // x
        if (term === "x") {
            return xTerm(factor);
        }

        // -x
        if (term === "-x") {
            return xTerm(-factor);
        }

        // عدد x
        let xMatch = term.match(/^([+-]?\d*\.?\d+)x$/);

        if (xMatch) {
            const coefficient = Number(xMatch[1]);
            return xTerm(coefficient * factor);
        }

        // عدد ثابت
        if (/^[+-]?\d*\.?\d+$/.test(term)) {
            return formatNumber(Number(term) * factor);
        }

        return null;
    }


    // =========================
    // باز کردن پرانتز
    // =========================

    function expandParentheses(expression) {

        expression = expression
            .replace(/\s+/g, "")
            .replace(/\*/g, "");

        let safety = 0;

        while (expression.includes("(") && safety < 50) {

            safety++;

            const closeIndex = expression.indexOf(")");

            if (closeIndex === -1) {
                break;
            }

            const openIndex = expression.lastIndexOf("(", closeIndex);

            if (openIndex === -1) {
                break;
            }

            const inside = expression.substring(
                openIndex + 1,
                closeIndex
            );

            const before = expression.substring(0, openIndex);

            const after = expression.substring(closeIndex + 1);

            let factor = 1;
            let factorText = "";

            // چیزی که بلافاصله قبل پرانتز قرار دارد
            const match = before.match(/([+-]?\d*\.?\d+)$/);

            if (match) {

                factorText = match[1];

                factor = Number(factorText);

                const newBefore = before.substring(
                    0,
                    before.length - factorText.length
                );

                const terms = splitTerms(inside);

                const multiplied = terms
                    .map(term => multiplyTerm(term, factor))
                    .filter(term => term !== null);

                if (multiplied.length === 0) {
                    return null;
                }

                expression =
                    newBefore +
                    multiplied.join("") +
                    after;

                continue;
            }

            // اگر مستقیماً - قبل پرانتز باشد
            if (before.endsWith("-")) {

                factor = -1;

                const newBefore = before.substring(
                    0,
                    before.length - 1
                );

                const terms = splitTerms(inside);

                const multiplied = terms
                    .map(term => multiplyTerm(term, factor))
                    .filter(term => term !== null);

                if (multiplied.length === 0) {
                    return null;
                }

                expression =
                    newBefore +
                    multiplied.join("") +
                    after;

                continue;
            }

            // اگر مستقیماً + قبل پرانتز باشد
            if (before.endsWith("+")) {

                factor = 1;

                const newBefore = before.substring(
                    0,
                    before.length - 1
                );

                const terms = splitTerms(inside);

                const multiplied = terms
                    .map(term => multiplyTerm(term, factor))
                    .filter(term => term !== null);

                if (multiplied.length === 0) {
                    return null;
                }

                expression =
                    newBefore +
                    multiplied.join("") +
                    after;

                continue;
            }

            // پرانتز بدون ضریب
            const terms = splitTerms(inside);

            const multiplied = terms
                .map(term => multiplyTerm(term, 1))
                .filter(term => term !== null);

            if (multiplied.length === 0) {
                return null;
            }

            expression =
                before +
                multiplied.join("") +
                after;
        }

        if (safety >= 50) {
            return null;
        }

        return expression;
    }


    // =========================
    // تجزیه چندجمله‌ای
    // a x² + b x + c
    // =========================

    function parsePolynomial(expression) {

        expression = expression
            .replace(/\s+/g, "")
            .replace(/\*/g, "");

        let a = 0;
        let b = 0;
        let c = 0;

        const terms = splitTerms(expression);

        for (let term of terms) {

            if (!term) continue;

            // =========================
            // x²
            // =========================

            let x2Match = term.match(
                /^([+-]?\d*\.?\d*)x\^2$/
            );

            if (x2Match) {

                let coefficient = x2Match[1];

                if (
                    coefficient === "" ||
                    coefficient === "+"
                ) {
                    coefficient = 1;
                } else if (coefficient === "-") {
                    coefficient = -1;
                } else {
                    coefficient = Number(coefficient);
                }

                a += coefficient;

                continue;
            }


            // =========================
            // x
            // این قسمت باید قبل از عدد ثابت بررسی شود
            // =========================

            let xMatch = term.match(
                /^([+-]?\d*\.?\d*)x$/
            );

            if (xMatch) {

                let coefficient = xMatch[1];

                if (
                    coefficient === "" ||
                    coefficient === "+"
                ) {
                    coefficient = 1;
                } else if (coefficient === "-") {
                    coefficient = -1;
                } else {
                    coefficient = Number(coefficient);
                }

                b += coefficient;

                continue;
            }


            // =========================
            // عدد ثابت
            // =========================

            if (/^[+-]?\d*\.?\d+$/.test(term)) {

                c += Number(term);

                continue;
            }

            // عبارت ناشناخته
            return null;
        }

        return {
            a: a,
            b: b,
            c: c
        };
    }


    // =========================
    // آماده‌سازی معادله
    // =========================

    function prepareEquation(input) {

        let equation = normalizeNumbers(input)
            .replace(/\s+/g, "")
            .replace(/−/g, "-")
            .replace(/×/g, "*");

        if (!equation.includes("=")) {
            return null;
        }

        const parts = equation.split("=");

        if (parts.length !== 2) {
            return null;
        }

        let left = parts[0];
        let right = parts[1];

        if (left === "" || right === "") {
            return null;
        }

        const originalLeft = left;
        const originalRight = right;

        const expandedLeft = expandParentheses(left);
        const expandedRight = expandParentheses(right);

        if (
            expandedLeft === null ||
            expandedRight === null
        ) {
            return null;
        }

        const leftPoly = parsePolynomial(expandedLeft);
        const rightPoly = parsePolynomial(expandedRight);

        if (!leftPoly || !rightPoly) {
            return null;
        }

        return {
            originalLeft,
            originalRight,

            expandedLeft,
            expandedRight,

            left: leftPoly,
            right: rightPoly
        };
    }


    // =========================
    // حل معادله
    // =========================

    function solveEquation(data) {

        const a = data.left.a - data.right.a;
        const b = data.left.b - data.right.b;
        const c = data.right.c - data.left.c;

        // معادله خطی
        if (Math.abs(a) < 0.0000000001) {

            if (Math.abs(b) < 0.0000000001) {

                if (Math.abs(c) < 0.0000000001) {
                    return {
                        type: "infinite"
                    };
                }

                return {
                    type: "none"
                };
            }

            return {
                type: "linear",
                a: b,
                c: c,
                x: c / b
            };
        }

        // معادله درجه دوم
        const discriminant =
            b * b - 4 * a * (-c);

        if (discriminant < 0) {

            return {
                type: "quadratic-none",
                a: a,
                b: b,
                c: c,
                discriminant: discriminant
            };
        }

        if (Math.abs(discriminant) < 0.0000000001) {

            const x = -b / (2 * a);

            return {
                type: "quadratic-one",
                a: a,
                b: b,
                c: c,
                discriminant: 0,
                x1: x,
                x2: x
            };
        }

        const sqrtD = Math.sqrt(discriminant);

        const x1 =
            (-b + sqrtD) / (2 * a);

        const x2 =
            (-b - sqrtD) / (2 * a);

        return {
            type: "quadratic-two",
            a: a,
            b: b,
            c: c,
            discriminant: discriminant,
            x1: x1,
            x2: x2
        };
    }


    // =========================
    // اضافه کردن مرحله
    // =========================

    function addStep(title, text, equation) {

        const div = document.createElement("div");

        div.className = "step";

        let html = "";

        if (title) {
            html += `<h3>${title}</h3>`;
        }

        if (text) {
            html += `<p>${text}</p>`;
        }

        if (equation) {
            html += `<div class="step-equation">${equation}</div>`;
        }

        div.innerHTML = html;

        steps.appendChild(div);
    }


    // =========================
    // مراحل معادله خطی
    // =========================

    function showLinearSteps(data, result) {

        const left = data.left;
        const right = data.right;

        const original =
            normalizeNumbers(equationInput.value)
                .replace(/\s+/g, "");

        const originalParts = original.split("=");

        const originalLeft =
            originalParts[0] || "";

        const originalRight =
            originalParts[1] || "";

        // =========================
        // مرحله اول
        // =========================

        let expandedChanged =
            data.expandedLeft !== originalLeft ||
            data.expandedRight !== originalRight;

        if (expandedChanged) {

            addStep(
                "مرحله 1: باز کردن پرانتز",
                "عبارت داخل پرانتز را باز می‌کنیم و ضریب یا علامت بیرون پرانتز را در تمام عبارت داخل آن پخش می‌کنیم.",
                data.expandedLeft + " = " + data.expandedRight
            );

        } else {

            addStep(
                "مرحله 1: معادله ساده‌شده",
                "",
                data.expandedLeft + " = " + data.expandedRight
            );
        }


        // =========================
        // ساخت ضرایب نهایی
        // =========================

        const a = left.a - right.a;
        const b = left.b - right.b;
        const c = right.c - left.c;


        // =========================
        // اگر جمله x در دو طرف باشد
        // =========================

        if (right.b !== 0 && left.b !== 0) {

            let newLeft;

            if (a === 0) {
                newLeft = "0";
            } else {
                newLeft = xTerm(a);
            }

            addStep(
                "مرحله 2: جمع کردن جمله‌های x",
                "جمله‌های دارای x را در یک طرف مساوی قرار می‌دهیم.",
                newLeft + " = " + formatNumber(c - b)
            );
        }


        // =========================
        // انتقال عدد ثابت
        // =========================

        if (Math.abs(b) > 0.0000000001) {

            let number = Math.abs(b);

            let signText =
                b > 0
                    ? "مثبت است، علامتش منفی می‌شود."
                    : "منفی است، علامتش مثبت می‌شود.";

            addStep(
                right.b !== 0 && left.b !== 0
                    ? "مرحله 3: انتقال عدد ثابت"
                    : "مرحله 2: انتقال عدد ثابت",

                "عدد " +
                formatNumber(number) +
                " را به طرف دیگر مساوی می‌بریم؛ چون " +
                signText,

                xTerm(a) +
                " = " +
                formatNumber(c)
            );

            // نتیجه بعد از انتقال
            addStep(
                "",
                "",
                xTerm(a) +
                " = " +
                formatNumber(c - b)
            );

        } else {

            addStep(
                right.b !== 0 && left.b !== 0
                    ? "مرحله 3: ساده‌سازی"
                    : "مرحله 2: ساده‌سازی",

                "",
                xTerm(a) +
                " = " +
                formatNumber(c)
            );
        }


        // =========================
        // تقسیم بر ضریب x
        // =========================

        const divisionStep =
            Math.abs(b) > 0.0000000001
                ? c - b
                : c;

        const stepNumber =
            right.b !== 0 && left.b !== 0
                ? (Math.abs(b) > 0.0000000001 ? 4 : 3)
                : (Math.abs(b) > 0.0000000001 ? 3 : 2);

        addStep(
            "مرحله " + stepNumber + ": تقسیم بر ضریب x",

            "حالا برای اینکه ضریب " +
            formatNumber(a) +
            " کنار x حذف شود و فقط x باقی بماند، دو طرف مساوی را بر " +
            formatNumber(a) +
            " تقسیم می‌کنیم.",

            xTerm(a) +
            " ÷ " +
            formatNumber(a) +
            " = " +
            formatNumber(divisionStep) +
            " ÷ " +
            formatNumber(a)
        );


        // =========================
        // جواب نهایی
        // =========================

        addStep(
            "جواب نهایی",
            "",
            "x = " + formatNumber(result.x)
        );
    }


    // =========================
    // مراحل درجه دوم
    // =========================

    function showQuadraticSteps(data, result) {

        const a = result.a;
        const b = result.b;
        const c = result.c;

        addStep(
            "مرحله 1: معادله ساده‌شده",
            "",
            equationText(a, b, -c)
        );

        const delta =
            b * b - 4 * a * (-c);

        addStep(
            "مرحله 2: محاسبه دلتا",
            "برای حل معادله درجه دوم ابتدا دلتا را حساب می‌کنیم.",
            "Δ = b² - 4ac = " +
            formatNumber(delta)
        );

        if (result.type === "quadratic-none") {

            addStep(
                "جواب",
                "چون دلتا منفی است، این معادله در مجموعه اعداد حقیقی جواب ندارد.",
                ""
            );

            return;
        }

        if (result.type === "quadratic-one") {

            addStep(
                "مرحله 3: استفاده از فرمول",
                "چون دلتا صفر است، معادله یک جواب دارد.",
                "x = " + formatNumber(result.x1)
            );

            return;
        }

        addStep(
            "مرحله 3: استفاده از فرمول درجه دوم",
            "از فرمول حل معادله درجه دوم استفاده می‌کنیم.",
            "x₁ = " + formatNumber(result.x1) +
            "<br>x₂ = " + formatNumber(result.x2)
        );
    }


    // =========================
    // بررسی جواب
    // =========================

    function createCheck(data, result) {

        if (
            result.type !== "linear" &&
            result.type !== "quadratic-one" &&
            result.type !== "quadratic-two"
        ) {
            checkResult.textContent =
                "برای این معادله بررسی جواب ممکن نیست.";

            return;
        }

        const values = [];

        if (result.type === "linear") {
            values.push(result.x);
        }

        if (result.type === "quadratic-one") {
            values.push(result.x1);
        }

        if (result.type === "quadratic-two") {
            values.push(result.x1);
            values.push(result.x2);
        }

        let text = "";

        values.forEach(function (x, index) {

            const leftValue =
                data.left.a * x * x +
                data.left.b * x +
                data.left.c;

            const rightValue =
                data.right.a * x * x +
                data.right.b * x +
                data.right.c;

            const correct =
                Math.abs(leftValue - rightValue) < 0.000001;

            if (values.length > 1) {
                text +=
                    "جواب " +
                    (index + 1) +
                    ": ";
            }

            text += correct
                ? "با جایگذاری جواب، دو طرف مساوی برابر می‌شوند؛ پس جواب درست است."
                : "با جایگذاری جواب، دو طرف مساوی برابر نشدند.";

            if (index < values.length - 1) {
                text += "\n";
            }
        });

        checkResult.textContent = text;
    }


    // =========================
    // تابع اصلی حل
    // =========================

    function solve() {

        const input =
            equationInput.value.trim();

        if (!input) {

            answer.textContent =
                "لطفاً ابتدا یک معادله وارد کن.";

            steps.innerHTML =
                '<p class="empty-message">مثلاً 2x + 5 = 17 را وارد کن.</p>';

            checkResult.textContent =
                "هنوز جوابی برای بررسی وجود ندارد.";

            return;
        }


        const data =
            prepareEquation(input);

        if (!data) {

            answer.textContent =
                "نتوانستم این معادله را تشخیص بدهم.";

            steps.innerHTML = `
                <p class="empty-message">
                    فعلاً معادله را به شکل ساده‌ای مثل
                    2x + 5 = 17
                    وارد کن.
                </p>
            `;

            checkResult.textContent =
                "جوابی برای بررسی وجود ندارد.";

            return;
        }


        const result =
            solveEquation(data);

        steps.innerHTML = "";


        // =========================
        // بی‌نهایت جواب
        // =========================

        if (result.type === "infinite") {

            answer.textContent =
                "این معادله بی‌نهایت جواب دارد.";

            addStep(
                "نتیجه",
                "دو طرف معادله یکسان هستند.",
                "∞"
            );

            checkResult.textContent =
                "این معادله بی‌نهایت جواب دارد.";

            return;
        }


        // =========================
        // بدون جواب
        // =========================

        if (result.type === "none") {

            answer.textContent =
                "این معادله جواب ندارد.";

            addStep(
                "نتیجه",
                "به یک عبارت نادرست رسیدیم؛ بنابراین معادله جواب ندارد.",
                "0 ≠ " + formatNumber(result.c)
            );

            checkResult.textContent =
                "این معادله جواب ندارد.";

            return;
        }


        // =========================
        // درجه اول
        // =========================

        if (result.type === "linear") {

            answer.textContent =
                "x = " + formatNumber(result.x);

            showLinearSteps(
                data,
                result
            );

            createCheck(
                data,
                result
            );

            return;
        }


        // =========================
        // درجه دوم بدون جواب حقیقی
        // =========================

        if (result.type === "quadratic-none") {

            answer.textContent =
                "این معادله در اعداد حقیقی جواب ندارد.";

            showQuadraticSteps(
                data,
                result
            );

            checkResult.textContent =
                "جواب حقیقی وجود ندارد.";

            return;
        }


        // =========================
        // درجه دوم
        // =========================

        if (
            result.type === "quadratic-one" ||
            result.type === "quadratic-two"
        ) {

            if (result.type === "quadratic-one") {

                answer.textContent =
                    "x = " +
                    formatNumber(result.x1);

            } else {

                answer.innerHTML =
                    "x₁ = " +
                    formatNumber(result.x1) +
                    "<br>x₂ = " +
                    formatNumber(result.x2);
            }

            showQuadraticSteps(
                data,
                result
            );

            createCheck(
                data,
                result
            );

            return;
        }
    }


    // =========================
    // پاک کردن
    // =========================

    function clearAll() {

        equationInput.value = "";

        answer.textContent =
            "هنوز معادله‌ای حل نشده است.";

        steps.innerHTML = `
            <p class="empty-message">
                بعد از حل معادله، مراحل اینجا نمایش داده می‌شود.
            </p>
        `;

        checkResult.textContent =
            "هنوز جوابی برای بررسی وجود ندارد.";
    }


    // =========================
    // حالت‌های ورود
    // =========================

    function setMode(activeButton) {

        const buttons = [
            textModeButton,
            sentenceModeButton,
            imageModeButton
        ];

        buttons.forEach(function (button) {

            if (button) {
                button.classList.remove("active");
            }

        });

        if (activeButton) {
            activeButton.classList.add("active");
        }
    }


    if (textModeButton) {

        textModeButton.addEventListener(
            "click",
            function () {

                setMode(textModeButton);

                equationInput.placeholder =
                    "مثلاً: 2x + 5 = 17";
            }
        );
    }


    if (sentenceModeButton) {

        sentenceModeButton.addEventListener(
            "click",
            function () {

                setMode(sentenceModeButton);

                equationInput.placeholder =
                    "مثلاً: دو برابر یک عدد به علاوه ۵ برابر ۱۷ است";
            }
        );
    }


    if (imageModeButton) {

        imageModeButton.addEventListener(
            "click",
            function () {

                setMode(imageModeButton);

                equationInput.placeholder =
                    "قابلیت حل از روی عکس در مرحله بعد اضافه می‌شود.";
            }
        );
    }


    // =========================
    // دکمه حل
    // =========================

    if (solveButton) {

        solveButton.addEventListener(
            "click",
            solve
        );
    }


    // =========================
    // دکمه پاک کردن
    // =========================

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            clearAll
        );
    }


    // =========================
    // Enter برای حل
    // =========================

    if (equationInput) {

        equationInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    solve();
                }
            }
        );
    }

});
