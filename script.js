document.addEventListener("DOMContentLoaded", function () {

    // =========================================================
    // عناصر صفحه
    // =========================================================

    const equationInput = document.getElementById("equationInput");
    const solveButton = document.getElementById("solveButton");
    const clearButton = document.getElementById("clearButton");

    const answer = document.getElementById("answer");
    const steps = document.getElementById("steps");
    const checkResult = document.getElementById("checkResult");

    const textModeButton = document.getElementById("textModeButton");
    const sentenceModeButton = document.getElementById("sentenceModeButton");
    const imageModeButton = document.getElementById("imageModeButton");


    // =========================================================
    // اعداد فارسی و عربی → انگلیسی
    // =========================================================

    function normalizeNumbers(text) {

        if (!text) return "";

        const persian = "۰۱۲۳۴۵۶۷۸۹";
        const arabic = "٠١٢٣٤٥٦٧٨٩";

        return text
            .replace(/[۰-۹]/g, function (char) {
                return persian.indexOf(char);
            })
            .replace(/[٠-٩]/g, function (char) {
                return arabic.indexOf(char);
            })
            .replace(/٫/g, ".")
            .replace(/،/g, ",")
            .replace(/×/g, "*")
            .replace(/−/g, "-")
            .replace(/÷/g, "/");
    }


    // =========================================================
    // نمایش عدد
    // =========================================================

    function formatNumber(number) {

        if (!Number.isFinite(number)) {
            return String(number);
        }

        if (Math.abs(number) < 0.0000000001) {
            number = 0;
        }

        if (Number.isInteger(number)) {
            return String(number);
        }

        return String(Number(number.toFixed(10)));
    }


    // =========================================================
    // نمایش جمله دارای x
    // =========================================================

    function formatX(coefficient) {

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


    // =========================================================
    // نمایش یک عبارت ax + b
    // =========================================================

    function formatLinear(a, b) {

        let result = "";

        if (a !== 0) {
            result = formatX(a);
        }

        if (b !== 0) {

            if (result === "") {
                result = formatNumber(b);
            }
            else if (b > 0) {
                result += " + " + formatNumber(b);
            }
            else {
                result += " - " + formatNumber(Math.abs(b));
            }
        }

        if (result === "") {
            result = "0";
        }

        return result;
    }


    // =========================================================
    // جدا کردن جمله‌های عبارت
    // =========================================================

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
                i > 0
            ) {

                if (current !== "") {
                    terms.push(current);
                }

                current = char;

            }
            else {
                current += char;
            }
        }

        if (current !== "") {
            terms.push(current);
        }

        return terms;
    }


    // =========================================================
    // ضرب یک جمله در یک عدد
    // =========================================================

    function multiplyTerm(term, factor) {

        term = term.replace(/\s+/g, "");

        // x
        if (term === "x") {
            return formatX(factor);
        }

        // -x
        if (term === "-x") {
            return formatX(-factor);
        }

        // عدد x
        const xMatch = term.match(/^([+-]?\d*\.?\d+)x$/);

        if (xMatch) {

            const coefficient = Number(xMatch[1]);

            return formatX(coefficient * factor);
        }

        // عدد ثابت
        if (/^[+-]?\d*\.?\d+$/.test(term)) {

            return formatNumber(
                Number(term) * factor
            );
        }

        return null;
    }


    // =========================================================
    // باز کردن پرانتز
    // =========================================================

    function expandParentheses(expression) {

        expression = expression
            .replace(/\s+/g, "")
            .replace(/\*/g, "");

        let safety = 0;

        while (expression.includes("(")) {

            safety++;

            if (safety > 50) {
                return null;
            }

            const closeIndex = expression.indexOf(")");

            if (closeIndex === -1) {
                return null;
            }

            const openIndex =
                expression.lastIndexOf("(", closeIndex);

            if (openIndex === -1) {
                return null;
            }

            const inside =
                expression.substring(
                    openIndex + 1,
                    closeIndex
                );

            const before =
                expression.substring(0, openIndex);

            const after =
                expression.substring(closeIndex + 1);

            let factor = 1;
            let beforeWithoutFactor = before;

            // -------------------------------------------------
            // ضریب عددی قبل پرانتز
            // مثال:
            // 2(x+3)
            // -2(x+3)
            // 3(x-4)
            // -------------------------------------------------

            const numberMatch =
                before.match(/([+-]?\d*\.?\d+)$/);

            if (numberMatch) {

                const factorText = numberMatch[1];

                factor = Number(factorText);

                beforeWithoutFactor =
                    before.substring(
                        0,
                        before.length - factorText.length
                    );
            }

            // -------------------------------------------------
            // منفی مستقیم قبل پرانتز
            // مثال:
            // -(x+5)
            // -------------------------------------------------

            else if (before.endsWith("-")) {

                factor = -1;

                beforeWithoutFactor =
                    before.substring(
                        0,
                        before.length - 1
                    );
            }

            // -------------------------------------------------
            // مثبت مستقیم قبل پرانتز
            // مثال:
            // +(x+5)
            // -------------------------------------------------

            else if (before.endsWith("+")) {

                factor = 1;

                beforeWithoutFactor =
                    before.substring(
                        0,
                        before.length - 1
                    );
            }

            const terms = splitTerms(inside);

            if (terms.length === 0) {
                return null;
            }

            const multiplied = [];

            for (const term of terms) {

                const result =
                    multiplyTerm(term, factor);

                if (result === null) {
                    return null;
                }

                multiplied.push(result);
            }

            expression =
                beforeWithoutFactor +
                multiplied.join("") +
                after;
        }

        // اگر پرانتز بسته اضافه وجود داشته باشد
        if (expression.includes(")")) {
            return null;
        }

        return expression;
    }


    // =========================================================
    // تجزیه عبارت
    //
    // نتیجه:
    // a = ضریب x
    // b = عدد ثابت
    //
    // مثال:
    // 2x+5
    //
    // a = 2
    // b = 5
    // =========================================================

    function parseLinear(expression) {

        expression = expression
            .replace(/\s+/g, "")
            .replace(/\*/g, "");

        const terms = splitTerms(expression);

        let a = 0;
        let b = 0;

        for (const term of terms) {

            if (!term) continue;


            // =================================================
            // اول x را بررسی می‌کنیم
            // این قسمت بسیار مهم است
            // =================================================

            const xMatch =
                term.match(/^([+-]?\d*\.?\d*)x$/);

            if (xMatch) {

                let coefficient =
                    xMatch[1];

                if (
                    coefficient === "" ||
                    coefficient === "+"
                ) {
                    coefficient = 1;
                }
                else if (coefficient === "-") {
                    coefficient = -1;
                }
                else {
                    coefficient = Number(coefficient);
                }

                a += coefficient;

                continue;
            }


            // =================================================
            // بعد عدد ثابت
            // =================================================

            if (/^[+-]?\d*\.?\d+$/.test(term)) {

                b += Number(term);

                continue;
            }


            // عبارت ناشناخته
            return null;
        }

        return {
            a: a,
            b: b
        };
    }


    // =========================================================
    // تجزیه عبارت درجه دوم
    // =========================================================

    function parsePolynomial(expression) {

        expression = expression
            .replace(/\s+/g, "")
            .replace(/\*/g, "");

        const terms = splitTerms(expression);

        let a = 0;
        let b = 0;
        let c = 0;

        for (const term of terms) {

            if (!term) continue;


            // x²
            const x2Match =
                term.match(/^([+-]?\d*\.?\d*)x\^2$/);

            if (x2Match) {

                let coefficient =
                    x2Match[1];

                if (
                    coefficient === "" ||
                    coefficient === "+"
                ) {
                    coefficient = 1;
                }
                else if (coefficient === "-") {
                    coefficient = -1;
                }
                else {
                    coefficient = Number(coefficient);
                }

                a += coefficient;

                continue;
            }


            // x
            const xMatch =
                term.match(/^([+-]?\d*\.?\d*)x$/);

            if (xMatch) {

                let coefficient =
                    xMatch[1];

                if (
                    coefficient === "" ||
                    coefficient === "+"
                ) {
                    coefficient = 1;
                }
                else if (coefficient === "-") {
                    coefficient = -1;
                }
                else {
                    coefficient = Number(coefficient);
                }

                b += coefficient;

                continue;
            }


            // عدد ثابت
            if (/^[+-]?\d*\.?\d+$/.test(term)) {

                c += Number(term);

                continue;
            }


            return null;
        }

        return {
            a: a,
            b: b,
            c: c
        };
    }


    // =========================================================
    // آماده‌سازی دو طرف معادله
    // =========================================================

    function prepareEquation(input) {

        let equation =
            normalizeNumbers(input)
                .replace(/\s+/g, "")
                .replace(/×/g, "*");

        const equalParts =
            equation.split("=");

        if (equalParts.length !== 2) {
            return null;
        }

        const originalLeft =
            equalParts[0];

        const originalRight =
            equalParts[1];

        if (
            originalLeft === "" ||
            originalRight === ""
        ) {
            return null;
        }


        // باز کردن پرانتزها
        const expandedLeft =
            expandParentheses(originalLeft);

        const expandedRight =
            expandParentheses(originalRight);

        if (
            expandedLeft === null ||
            expandedRight === null
        ) {
            return null;
        }


        // تجزیه درجه دوم
        const left =
            parsePolynomial(expandedLeft);

        const right =
            parsePolynomial(expandedRight);

        if (!left || !right) {
            return null;
        }

        return {
            originalLeft: originalLeft,
            originalRight: originalRight,

            expandedLeft: expandedLeft,
            expandedRight: expandedRight,

            left: left,
            right: right
        };
    }


    // =========================================================
    // حل معادله
    // =========================================================

    function solveEquation(data) {

        // انتقال همه جمله‌ها به یک طرف:
        //
        // ax² + bx + c = 0

        const A =
            data.left.a -
            data.right.a;

        const B =
            data.left.b -
            data.right.b;

        const C =
            data.left.c -
            data.right.c;


        // -----------------------------------------------------
        // معادله خطی
        // -----------------------------------------------------

        if (Math.abs(A) < 0.0000000001) {

            // Bx + C = 0
            //
            // Bx = -C
            //
            // x = -C / B

            if (Math.abs(B) < 0.0000000001) {

                if (Math.abs(C) < 0.0000000001) {

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
                coefficient: B,
                constant: C,
                x: -C / B
            };
        }


        // -----------------------------------------------------
        // معادله درجه دوم
        // -----------------------------------------------------

        const delta =
            B * B -
            4 * A * C;


        if (delta < -0.0000000001) {

            return {
                type: "quadratic-none",
                A: A,
                B: B,
                C: C,
                delta: delta
            };
        }


        if (Math.abs(delta) < 0.0000000001) {

            const x =
                -B / (2 * A);

            return {
                type: "quadratic-one",
                A: A,
                B: B,
                C: C,
                delta: 0,
                x1: x
            };
        }


        const sqrtDelta =
            Math.sqrt(delta);

        const x1 =
            (-B + sqrtDelta) /
            (2 * A);

        const x2 =
            (-B - sqrtDelta) /
            (2 * A);

        return {
            type: "quadratic-two",
            A: A,
            B: B,
            C: C,
            delta: delta,
            x1: x1,
            x2: x2
        };
    }


    // =========================================================
    // اضافه کردن مرحله
    // =========================================================

    function addStep(title, description, equation) {

        const div =
            document.createElement("div");

        div.className = "step";

        let html = "";

        if (title) {
            html += "<h3>" + title + "</h3>";
        }

        if (description) {
            html += "<p>" + description + "</p>";
        }

        if (equation) {
            html +=
                '<div class="step-equation">' +
                equation +
                "</div>";
        }

        div.innerHTML = html;

        steps.appendChild(div);
    }


    // =========================================================
    // مراحل معادله خطی
    // =========================================================

    function showLinearSteps(data, result) {

        const original =
            normalizeNumbers(equationInput.value)
                .replace(/\s+/g, "");

        const originalParts =
            original.split("=");

        const originalLeft =
            originalParts[0] || "";

        const originalRight =
            originalParts[1] || "";


        const expandedLeft =
            data.expandedLeft;

        const expandedRight =
            data.expandedRight;


        // =====================================================
        // مرحله 1
        // =====================================================

        const parenthesesWereUsed =
            expandedLeft !== originalLeft ||
            expandedRight !== originalRight;


        if (parenthesesWereUsed) {

            addStep(
                "مرحله 1: باز کردن پرانتز",
                "ضریب یا علامت بیرون پرانتز را در تمام عبارت داخل پرانتز پخش می‌کنیم.",
                expandedLeft +
                " = " +
                expandedRight
            );

        }
        else {

            addStep(
                "مرحله 1: معادله ساده‌شده",
                "",
                expandedLeft +
                " = " +
                expandedRight
            );
        }


        // =====================================================
        // استخراج ضرایب
        //
        // سمت چپ:
        // left.a x + left.b
        //
        // سمت راست:
        // right.a x + right.b
        // =====================================================

        const leftA =
            data.left.b;

        const leftB =
            data.left.c;

        const rightA =
            data.right.b;

        const rightB =
            data.right.c;


        // =====================================================
        // ساخت معادله بعد از انتقال x ها
        // =====================================================

        const coefficient =
            leftA - rightA;

        const constantRight =
            rightB - leftB;


        // =====================================================
        // اگر عدد ثابت در سمت چپ وجود دارد
        // =====================================================

        if (Math.abs(leftB) > 0.0000000001) {

            const amount =
                Math.abs(leftB);

            const signDescription =
                leftB > 0
                    ? "مثبت است، علامتش منفی می‌شود."
                    : "منفی است، علامتش مثبت می‌شود.";


            addStep(
                "مرحله 2: انتقال عدد ثابت",
                "عدد " +
                formatNumber(amount) +
                " را به طرف دیگر مساوی می‌بریم؛ چون " +
                signDescription,

                formatX(leftA) +
                " = " +
                formatNumber(rightB) +
                " " +
                (leftB > 0 ? "- " : "+ ") +
                formatNumber(amount)
            );


            addStep(
                "",
                "",
                formatX(leftA) +
                " = " +
                formatNumber(constantRight)
            );
        }


        // =====================================================
        // اگر عدد ثابت در سمت راست وجود دارد و x هم آنجاست
        // =====================================================

        if (
            Math.abs(rightA) > 0.0000000001 &&
            Math.abs(leftA) > 0.0000000001
        ) {

            const xCoefficient =
                leftA - rightA;


            addStep(
                "مرحله بعد: جمع کردن جمله‌های x",
                "جمله‌های دارای x را در یک طرف مساوی قرار می‌دهیم.",

                formatX(xCoefficient) +
                " = " +
                formatNumber(constantRight)
            );
        }


        // =====================================================
        // اگر هیچ انتقالی لازم نبود
        // =====================================================

        if (
            Math.abs(leftB) < 0.0000000001 &&
            Math.abs(rightA) < 0.0000000001
        ) {

            addStep(
                "مرحله 2: معادله ساده‌شده",
                "",
                formatX(coefficient) +
                " = " +
                formatNumber(constantRight)
            );
        }


        // =====================================================
        // تقسیم بر ضریب x
        // =====================================================

        const divisionNumber =
            constantRight;


        addStep(
            "مرحله 3: تقسیم بر ضریب x",

            "حالا برای اینکه ضریب " +
            formatNumber(coefficient) +
            " کنار x حذف شود و فقط x باقی بماند، دو طرف مساوی را بر " +
            formatNumber(coefficient) +
            " تقسیم می‌کنیم.",

            formatX(coefficient) +
            " ÷ " +
            formatNumber(coefficient) +
            " = " +
            formatNumber(divisionNumber) +
            " ÷ " +
            formatNumber(coefficient)
        );


        // =====================================================
        // جواب نهایی
        // =====================================================

        addStep(
            "جواب نهایی",
            "",
            "x = " +
            formatNumber(result.x)
        );
    }


    // =========================================================
    // مراحل درجه دوم
    // =========================================================

    function showQuadraticSteps(data, result) {

        const A = result.A;
        const B = result.B;
        const C = result.C;


        addStep(
            "مرحله 1: انتقال همه جمله‌ها به یک طرف",
            "معادله را به شکل ax² + bx + c = 0 می‌نویسیم.",

            formatNumber(A) +
            "x² " +
            (B >= 0 ? "+ " : "- ") +
            formatNumber(Math.abs(B)) +
            "x " +
            (C >= 0 ? "+ " : "- ") +
            formatNumber(Math.abs(C)) +
            " = 0"
        );


        addStep(
            "مرحله 2: محاسبه دلتا",
            "ابتدا دلتا را با فرمول Δ = b² - 4ac حساب می‌کنیم.",

            "Δ = " +
            formatNumber(result.delta)
        );


        if (result.type === "quadratic-none") {

            addStep(
                "نتیجه",
                "چون دلتا منفی است، این معادله در اعداد حقیقی جواب ندارد.",
                ""
            );

            return;
        }


        if (result.type === "quadratic-one") {

            addStep(
                "مرحله 3: استفاده از فرمول",
                "چون دلتا صفر است، معادله یک جواب دارد.",

                "x = " +
                formatNumber(result.x1)
            );

            return;
        }


        addStep(
            "مرحله 3: استفاده از فرمول درجه دوم",
            "از فرمول حل معادله درجه دوم استفاده می‌کنیم.",

            "x₁ = " +
            formatNumber(result.x1) +
            "<br>" +
            "x₂ = " +
            formatNumber(result.x2)
        );
    }


    // =========================================================
    // بررسی جواب
    // =========================================================

    function evaluatePolynomial(poly, x) {

        return (
            poly.a * x * x +
            poly.b * x +
            poly.c
        );
    }


    function createCheck(data, result) {

        if (
            result.type !== "linear" &&
            result.type !== "quadratic-one" &&
            result.type !== "quadratic-two"
        ) {

            checkResult.textContent =
                "جواب حقیقی برای بررسی وجود ندارد.";

            return;
        }


        const solutions = [];


        if (result.type === "linear") {
            solutions.push(result.x);
        }

        if (result.type === "quadratic-one") {
            solutions.push(result.x1);
        }

        if (result.type === "quadratic-two") {
            solutions.push(result.x1);
            solutions.push(result.x2);
        }


        let output = "";


        solutions.forEach(function (x, index) {

            const leftValue =
                evaluatePolynomial(
                    data.left,
                    x
                );

            const rightValue =
                evaluatePolynomial(
                    data.right,
                    x
                );

            const correct =
                Math.abs(
                    leftValue - rightValue
                ) < 0.000001;


            if (solutions.length > 1) {

                output +=
                    "جواب " +
                    (index + 1) +
                    ": ";
            }


            output += correct
                ? "با جایگذاری جواب، دو طرف مساوی برابر می‌شوند؛ پس جواب درست است."
                : "با جایگذاری جواب، دو طرف مساوی برابر نشدند.";


            if (index < solutions.length - 1) {
                output += "\n";
            }
        });


        checkResult.textContent =
            output;
    }


    // =========================================================
    // حل
    // =========================================================

    function solve() {

        const input =
            equationInput.value.trim();


        if (!input) {

            answer.textContent =
                "لطفاً ابتدا یک معادله وارد کن.";

            steps.innerHTML = `
                <p class="empty-message">
                    مثلاً 2x + 5 = 17 را وارد کن.
                </p>
            `;

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


        // =====================================================
        // بی‌نهایت جواب
        // =====================================================

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


        // =====================================================
        // بدون جواب
        // =====================================================

        if (result.type === "none") {

            answer.textContent =
                "این معادله جواب ندارد.";

            addStep(
                "نتیجه",
                "این معادله به یک عبارت نادرست می‌رسد، بنابراین جواب ندارد.",
                "0 ≠ 0"
            );

            checkResult.textContent =
                "این معادله جواب ندارد.";

            return;
        }


        // =====================================================
        // خطی
        // =====================================================

        if (result.type === "linear") {

            answer.textContent =
                "x = " +
                formatNumber(result.x);


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


        // =====================================================
        // درجه دوم
        // =====================================================

        if (
            result.type === "quadratic-none" ||
            result.type === "quadratic-one" ||
            result.type === "quadratic-two"
        ) {

            if (result.type === "quadratic-none") {

                answer.textContent =
                    "این معادله در اعداد حقیقی جواب ندارد.";
            }

            else if (result.type === "quadratic-one") {

                answer.textContent =
                    "x = " +
                    formatNumber(result.x1);
            }

            else {

                answer.innerHTML =
                    "x₁ = " +
                    formatNumber(result.x1) +
                    "<br>" +
                    "x₂ = " +
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
        }
    }


    // =========================================================
    // پاک کردن
    // =========================================================

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


    // =========================================================
    // حالت تایپ
    // =========================================================

    function activateMode(button) {

        [
            textModeButton,
            sentenceModeButton,
            imageModeButton
        ].forEach(function (item) {

            if (item) {
                item.classList.remove("active");
            }
        });


        if (button) {
            button.classList.add("active");
        }
    }


    if (textModeButton) {

        textModeButton.addEventListener(
            "click",
            function () {

                activateMode(textModeButton);

                equationInput.placeholder =
                    "مثلاً: 2x + 5 = 17";
            }
        );
    }


    // =========================================================
    // حالت جمله فارسی
    // =========================================================

    if (sentenceModeButton) {

        sentenceModeButton.addEventListener(
            "click",
            function () {

                activateMode(sentenceModeButton);

                equationInput.placeholder =
                    "مثلاً: دو برابر یک عدد به علاوه ۵ برابر ۱۷ است";
            }
        );
    }


    // =========================================================
    // حالت عکس
    // =========================================================

    if (imageModeButton) {

        imageModeButton.addEventListener(
            "click",
            function () {

                activateMode(imageModeButton);

                equationInput.placeholder =
                    "قابلیت حل از روی عکس در مرحله بعد اضافه می‌شود.";
            }
        );
    }


    // =========================================================
    // دکمه حل
    // =========================================================

    if (solveButton) {

        solveButton.addEventListener(
            "click",
            solve
        );
    }


    // =========================================================
    // دکمه پاک کردن
    // =========================================================

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            clearAll
        );
    }


    // =========================================================
    // Enter
    // =========================================================

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
