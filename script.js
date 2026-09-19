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
    // تبدیل اعداد فارسی و عربی
    // =========================================================

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
            .replace(/×/g, "*")
            .replace(/−/g, "-")
            .replace(/÷/g, "/")
            .replace(/،/g, ",");
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
    // نمایش ضریب x
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
    // نمایش عبارت ax + b
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
    // جدا کردن جمله‌ها
    // =========================================================

    function splitTerms(expression) {

        expression = expression
            .replace(/\s+/g, "")
            .replace(/\*/g, "");

        if (expression === "") {
            return [];
        }

        const terms = [];
        let current = "";

        for (let i = 0; i < expression.length; i++) {

            const char = expression[i];

            // + یا - جدید، شروع یک جمله جدید است
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

        // اگر عبارت با علامت شروع نشده، علامت + را به جمله اول اضافه می‌کنیم
        if (
            terms.length > 0 &&
            terms[0][0] !== "+" &&
            terms[0][0] !== "-"
        ) {
            terms[0] = "+" + terms[0];
        }

        return terms;
    }


    // =========================================================
    // ضرب جمله در عدد
    // =========================================================

    function multiplyTerm(term, factor) {

        term = term.replace(/\s+/g, "");

        // =====================================================
        // +x
        // =====================================================

        if (term === "+x") {
            return formatX(factor);
        }

        // =====================================================
        // -x
        // =====================================================

        if (term === "-x") {
            return formatX(-factor);
        }

        // =====================================================
        // x
        // =====================================================

        if (term === "x") {
            return formatX(factor);
        }

        // =====================================================
        // ضریب x
        //
        // مثال:
        // +2x
        // -2x
        // 2x
        // =====================================================

        const xMatch =
            term.match(/^([+-]?\d*\.?\d+)x$/);

        if (xMatch) {

            const coefficient =
                Number(xMatch[1]);

            return formatX(
                coefficient * factor
            );
        }

        // =====================================================
        // عدد ثابت
        // =====================================================

        if (/^[+-]?\d*\.?\d+$/.test(term)) {

            return formatNumber(
                Number(term) * factor
            );
        }

        return null;
    }


    // =========================================================
    // باز کردن پرانتزها
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

            const closeIndex =
                expression.indexOf(")");

            if (closeIndex === -1) {
                return null;
            }

            const openIndex =
                expression.lastIndexOf(
                    "(",
                    closeIndex
                );

            if (openIndex === -1) {
                return null;
            }

            const inside =
                expression.substring(
                    openIndex + 1,
                    closeIndex
                );

            const before =
                expression.substring(
                    0,
                    openIndex
                );

            const after =
                expression.substring(
                    closeIndex + 1
                );


            let factor = 1;
            let beforeWithoutFactor = before;


            // =================================================
            // عدد قبل پرانتز
            //
            // 2(x+3)
            // -2(x+3)
            // 3(x-4)
            // =================================================

            const numberMatch =
                before.match(/([+-]?\d*\.?\d+)$/);

            if (numberMatch) {

                const factorText =
                    numberMatch[1];

                factor =
                    Number(factorText);

                beforeWithoutFactor =
                    before.substring(
                        0,
                        before.length -
                        factorText.length
                    );
            }

            // =================================================
            // منفی مستقیم قبل پرانتز
            //
            // -(x+5)
            // =================================================

            else if (before.endsWith("-")) {

                factor = -1;

                beforeWithoutFactor =
                    before.substring(
                        0,
                        before.length - 1
                    );
            }

            // =================================================
            // مثبت مستقیم قبل پرانتز
            //
            // +(x+5)
            // =================================================

            else if (before.endsWith("+")) {

                factor = 1;

                beforeWithoutFactor =
                    before.substring(
                        0,
                        before.length - 1
                    );
            }


            // =================================================
            // جمله‌های داخل پرانتز
            // =================================================

            const terms =
                splitTerms(inside);

            if (terms.length === 0) {
                return null;
            }


            const multiplied = [];

            for (const term of terms) {

                const result =
                    multiplyTerm(
                        term,
                        factor
                    );

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


        // پرانتز بسته اضافی
        if (expression.includes(")")) {
            return null;
        }

        return expression;
    }


    // =========================================================
    // تجزیه چندجمله‌ای
    //
    // a = ضریب x²
    // b = ضریب x
    // c = عدد ثابت
    // =========================================================

    function parsePolynomial(expression) {

        expression = expression
            .replace(/\s+/g, "")
            .replace(/\*/g, "");

        const terms =
            splitTerms(expression);

        let a = 0;
        let b = 0;
        let c = 0;


        for (const term of terms) {

            if (!term) {
                continue;
            }


            // =================================================
            // x²
            // =================================================

            const x2Match =
                term.match(
                    /^([+-]?\d*\.?\d*)x\^2$/
                );

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
                    coefficient =
                        Number(coefficient);
                }

                a += coefficient;

                continue;
            }


            // =================================================
            // x
            //
            // خیلی مهم:
            // +x
            // -x
            // 2x
            // -2x
            // =================================================

            const xMatch =
                term.match(
                    /^([+-]?\d*\.?\d*)x$/
                );

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
                    coefficient =
                        Number(coefficient);
                }

                b += coefficient;

                continue;
            }


            // =================================================
            // عدد ثابت
            // =================================================

            if (
                /^[+-]?\d*\.?\d+$/.test(term)
            ) {

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


    // =========================================================
    // آماده‌سازی معادله
    // =========================================================

    function prepareEquation(input) {

        const equation =
            normalizeNumbers(input)
                .replace(/\s+/g, "")
                .replace(/\*/g, "");


        const parts =
            equation.split("=");


        if (parts.length !== 2) {
            return null;
        }


        const originalLeft =
            parts[0];

        const originalRight =
            parts[1];


        if (
            originalLeft === "" ||
            originalRight === ""
        ) {
            return null;
        }


        // باز کردن پرانتزهای سمت چپ
        const expandedLeft =
            expandParentheses(
                originalLeft
            );


        // باز کردن پرانتزهای سمت راست
        const expandedRight =
            expandParentheses(
                originalRight
            );


        if (
            expandedLeft === null ||
            expandedRight === null
        ) {
            return null;
        }


        const left =
            parsePolynomial(
                expandedLeft
            );

        const right =
            parsePolynomial(
                expandedRight
            );


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

        // همه جمله‌ها را به شکل زیر در نظر می‌گیریم:
        //
        // Ax² + Bx + C = 0

        const A =
            data.left.a -
            data.right.a;

        const B =
            data.left.b -
            data.right.b;

        const C =
            data.left.c -
            data.right.c;


        // =====================================================
        // معادله خطی
        // =====================================================

        if (
            Math.abs(A) <
            0.0000000001
        ) {

            // Bx + C = 0

            if (
                Math.abs(B) <
                0.0000000001
            ) {

                if (
                    Math.abs(C) <
                    0.0000000001
                ) {

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


        // =====================================================
        // معادله درجه دوم
        // =====================================================

        const delta =
            B * B -
            4 * A * C;


        if (
            delta <
            -0.0000000001
        ) {

            return {
                type: "quadratic-none",

                A: A,
                B: B,
                C: C,

                delta: delta
            };
        }


        if (
            Math.abs(delta) <
            0.0000000001
        ) {

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

    function addStep(
        title,
        description,
        equation
    ) {

        const div =
            document.createElement("div");

        div.className = "step";


        let html = "";


        if (title) {

            html +=
                "<h3>" +
                title +
                "</h3>";
        }


        if (description) {

            html +=
                "<p>" +
                description +
                "</p>";
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

    function showLinearSteps(
        data,
        result
    ) {

        // -----------------------------------------------------
        // ضرایب واقعی دو طرف
        //
        // سمت چپ:
        // left.b = ضریب x
        // left.c = عدد ثابت
        //
        // سمت راست:
        // right.b = ضریب x
        // right.c = عدد ثابت
        // -----------------------------------------------------

        const leftX =
            data.left.b;

        const leftNumber =
            data.left.c;

        const rightX =
            data.right.b;

        const rightNumber =
            data.right.c;


        // -----------------------------------------------------
        // مرحله ۱
        // -----------------------------------------------------

        const original =
            normalizeNumbers(
                equationInput.value
            )
            .replace(/\s+/g, "");


        const originalParts =
            original.split("=");


        const originalLeft =
            originalParts[0] || "";

        const originalRight =
            originalParts[1] || "";


        const hasParentheses =
            data.expandedLeft !== originalLeft ||
            data.expandedRight !== originalRight;


        if (hasParentheses) {

            addStep(
                "مرحله 1: باز کردن پرانتز",

                "ضریب یا علامت بیرون پرانتز را در تمام عبارت داخل پرانتز پخش می‌کنیم.",

                data.expandedLeft +
                " = " +
                data.expandedRight
            );

        }
        else {

            addStep(
                "مرحله 1: معادله ساده‌شده",

                "",

                data.expandedLeft +
                " = " +
                data.expandedRight
            );
        }


        // =====================================================
        // حالت ساده:
        //
        // 2x + 5 = 17
        // =====================================================

        if (
            leftX !== 0 &&
            rightX === 0
        ) {

            // -------------------------------------------------
            // انتقال عدد ثابت
            // -------------------------------------------------

            if (leftNumber !== 0) {

                const amount =
                    Math.abs(leftNumber);

                const signText =
                    leftNumber > 0
                        ? "مثبت است، علامتش منفی می‌شود."
                        : "منفی است، علامتش مثبت می‌شود.";


                const operation =
                    leftNumber > 0
                        ? "-"
                        : "+";


                addStep(
                    "مرحله 2: انتقال عدد ثابت",

                    "عدد " +
                    formatNumber(amount) +
                    " را به طرف دیگر مساوی می‌بریم؛ چون " +
                    signText,

                    formatX(leftX) +
                    " = " +
                    formatNumber(rightNumber) +
                    " " +
                    operation +
                    " " +
                    formatNumber(amount)
                );


                const newRight =
                    rightNumber -
                    leftNumber;


                addStep(
                    "",

                    "",

                    formatX(leftX) +
                    " = " +
                    formatNumber(newRight)
                );

            }
            else {

                addStep(
                    "مرحله 2: ساده‌سازی",

                    "",

                    formatX(leftX) +
                    " = " +
                    formatNumber(rightNumber)
                );
            }


            // -------------------------------------------------
            // تقسیم
            // -------------------------------------------------

            const finalRight =
                rightNumber -
                leftNumber;


            addStep(
                "مرحله 3: تقسیم بر ضریب x",

                "حالا برای اینکه ضریب " +
                formatNumber(leftX) +
                " کنار x حذف شود و فقط x باقی بماند، دو طرف مساوی را بر " +
                formatNumber(leftX) +
                " تقسیم می‌کنیم.",

                formatX(leftX) +
                " ÷ " +
                formatNumber(leftX) +
                " = " +
                formatNumber(finalRight) +
                " ÷ " +
                formatNumber(leftX)
            );


            addStep(
                "جواب نهایی",

                "",

                "x = " +
                formatNumber(result.x)
            );


            return;
        }


        // =====================================================
        // حالت:
        //
        // 2x = 17 - 5
        // یا x در هر دو طرف
        // =====================================================

        if (
            leftX !== 0 ||
            rightX !== 0
        ) {

            const combinedX =
                leftX -
                rightX;


            const combinedNumber =
                rightNumber -
                leftNumber;


            // اگر عدد ثابت سمت چپ وجود دارد
            if (leftNumber !== 0) {

                const amount =
                    Math.abs(leftNumber);

                const signText =
                    leftNumber > 0
                        ? "مثبت است، علامتش منفی می‌شود."
                        : "منفی است، علامتش مثبت می‌شود.";


                addStep(
                    "مرحله 2: انتقال عدد ثابت",

                    "عدد " +
                    formatNumber(amount) +
                    " را به طرف دیگر مساوی می‌بریم؛ چون " +
                    signText,

                    formatX(leftX) +
                    " = " +
                    formatNumber(rightNumber) +
                    " " +
                    (leftNumber > 0 ? "-" : "+") +
                    " " +
                    formatNumber(amount)
                );
            }


            // اگر x در دو طرف باشد
            if (
                leftX !== 0 &&
                rightX !== 0
            ) {

                addStep(
                    "مرحله بعد: جمع کردن جمله‌های x",

                    "جمله‌های دارای x را در یک طرف مساوی قرار می‌دهیم.",

                    formatX(combinedX) +
                    " = " +
                    formatNumber(combinedNumber)
                );
            }


            // تقسیم
            addStep(
                "مرحله بعد: تقسیم بر ضریب x",

                "حالا برای اینکه ضریب " +
                formatNumber(combinedX) +
                " کنار x حذف شود و فقط x باقی بماند، دو طرف مساوی را بر " +
                formatNumber(combinedX) +
                " تقسیم می‌کنیم.",

                formatX(combinedX) +
                " ÷ " +
                formatNumber(combinedX) +
                " = " +
                formatNumber(combinedNumber) +
                " ÷ " +
                formatNumber(combinedX)
            );


            addStep(
                "جواب نهایی",

                "",

                "x = " +
                formatNumber(result.x)
            );


            return;
        }


        // =====================================================
        // حالت خاص
        // =====================================================

        addStep(
            "نتیجه",
            "",
            "x = " +
            formatNumber(result.x)
        );
    }


    // =========================================================
    // مراحل درجه دوم
    // =========================================================

    function showQuadraticSteps(
        data,
        result
    ) {

        const A = result.A;
        const B = result.B;
        const C = result.C;


        let equation =
            formatNumber(A) +
            "x²";


        if (B > 0) {
            equation +=
                " + " +
                formatNumber(B) +
                "x";
        }
        else if (B < 0) {
            equation +=
                " - " +
                formatNumber(Math.abs(B)) +
                "x";
        }


        if (C > 0) {
            equation +=
                " + " +
                formatNumber(C);
        }
        else if (C < 0) {
            equation +=
                " - " +
                formatNumber(Math.abs(C));
        }


        equation += " = 0";


        addStep(
            "مرحله 1: انتقال همه جمله‌ها به یک طرف",

            "معادله را به شکل ax² + bx + c = 0 می‌نویسیم.",

            equation
        );


        addStep(
            "مرحله 2: محاسبه دلتا",

            "ابتدا دلتا را با فرمول Δ = b² - 4ac حساب می‌کنیم.",

            "Δ = " +
            formatNumber(result.delta)
        );


        if (
            result.type ===
            "quadratic-none"
        ) {

            addStep(
                "نتیجه",

                "چون دلتا منفی است، این معادله در اعداد حقیقی جواب ندارد.",

                ""
            );

            return;
        }


        if (
            result.type ===
            "quadratic-one"
        ) {

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
    // محاسبه مقدار چندجمله‌ای
    // =========================================================

    function evaluatePolynomial(
        polynomial,
        x
    ) {

        return (
            polynomial.a * x * x +
            polynomial.b * x +
            polynomial.c
        );
    }


    // =========================================================
    // بررسی جواب
    // =========================================================

    function createCheck(
        data,
        result
    ) {

        const solutions = [];


        if (
            result.type === "linear"
        ) {
            solutions.push(result.x);
        }


        if (
            result.type === "quadratic-one"
        ) {
            solutions.push(result.x1);
        }


        if (
            result.type === "quadratic-two"
        ) {
            solutions.push(result.x1);
            solutions.push(result.x2);
        }


        if (solutions.length === 0) {

            checkResult.textContent =
                "جواب حقیقی برای بررسی وجود ندارد.";

            return;
        }


        let output = "";


        solutions.forEach(
            function (x, index) {

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
                        leftValue -
                        rightValue
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


                if (
                    index <
                    solutions.length - 1
                ) {
                    output += "\n";
                }
            }
        );


        checkResult.textContent =
            output;
    }


    // =========================================================
    // تابع اصلی حل
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

        if (
            result.type === "infinite"
        ) {

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

        if (
            result.type === "none"
        ) {

            answer.textContent =
                "این معادله جواب ندارد.";

            addStep(
                "نتیجه",

                "این معادله جواب ندارد.",

                ""
            );

            checkResult.textContent =
                "این معادله جواب ندارد.";

            return;
        }


        // =====================================================
        // خطی
        // =====================================================

        if (
            result.type === "linear"
        ) {

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
            result.type ===
            "quadratic-none"
        ) {

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


        if (
            result.type ===
            "quadratic-one"
        ) {

            answer.textContent =
                "x = " +
                formatNumber(result.x1);

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


        if (
            result.type ===
            "quadratic-two"
        ) {

            answer.innerHTML =
                "x₁ = " +
                formatNumber(result.x1) +
                "<br>" +
                "x₂ = " +
                formatNumber(result.x2);


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
        ].forEach(
            function (item) {

                if (item) {
                    item.classList.remove(
                        "active"
                    );
                }
            }
        );


        if (button) {
            button.classList.add("active");
        }
    }


    if (textModeButton) {

        textModeButton.addEventListener(
            "click",
            function () {

                activateMode(
                    textModeButton
                );

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

                activateMode(
                    sentenceModeButton
                );

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

                activateMode(
                    imageModeButton
                );

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
    // کلید Enter
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
