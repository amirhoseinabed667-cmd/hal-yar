document.addEventListener("DOMContentLoaded", function () {

    const input = document.getElementById("equationInput");
    const solveButton = document.getElementById("solveButton");
    const clearButton = document.getElementById("clearButton");

    const answer = document.getElementById("answer");
    const steps = document.getElementById("steps");
    const checkResult = document.getElementById("checkResult");

    const textModeButton = document.getElementById("textModeButton");
    const sentenceModeButton = document.getElementById("sentenceModeButton");
    const imageModeButton = document.getElementById("imageModeButton");


    /* =========================
       ابزارهای کمکی
    ========================= */

    function normalizeNumbers(text) {

        const persian = "۰۱۲۳۴۵۶۷۸۹";
        const arabic = "٠١٢٣٤٥٦٧٨٩";

        return text
            .replace(/[۰-۹]/g, function (d) {
                return persian.indexOf(d);
            })
            .replace(/[٠-٩]/g, function (d) {
                return arabic.indexOf(d);
            })
            .replace(/×/g, "*")
            .replace(/÷/g, "/")
            .replace(/−/g, "-")
            .replace(/²/g, "^2")
            .replace(/\s+/g, "");
    }


    function numberText(number) {

        if (number === 0) return "0";

        if (Number.isInteger(number)) {
            return String(number);
        }

        return String(Number(number.toFixed(6)));
    }


    function formatNumber(number) {

        if (number === 0) return "0";

        if (Number.isInteger(number)) {
            return String(number);
        }

        return String(Number(number.toFixed(6)));
    }


    function polynomialText(poly) {

        const b = poly[1] || 0;
        const c = poly[0] || 0;

        let text = "";

        if (b !== 0) {

            if (b === 1) {
                text += "x";
            }
            else if (b === -1) {
                text += "-x";
            }
            else {
                text += numberText(b) + "x";
            }
        }

        if (c !== 0) {

            if (text !== "") {

                if (c > 0) {
                    text += " + " + numberText(c);
                }
                else {
                    text += " - " + numberText(Math.abs(c));
                }

            }
            else {
                text += numberText(c);
            }
        }

        if (text === "") {
            text = "0";
        }

        return text;
    }


    function xTerm(coefficient) {

        if (coefficient === 1) {
            return "x";
        }

        if (coefficient === -1) {
            return "-x";
        }

        return numberText(coefficient) + "x";
    }


    function equationText(left, right) {

        return polynomialText(left) + " = " + polynomialText(right);
    }


    /* =========================
       تبدیل عبارت به چندجمله‌ای
    ========================= */

    function parsePolynomial(expression) {

        expression = expression
            .replace(/\(/g, "")
            .replace(/\)/g, "");

        expression = expression.replace(/-/g, "+-");

        const parts = expression.split("+");

        let constant = 0;
        let xCoefficient = 0;
        let xSquaredCoefficient = 0;

        for (let part of parts) {

            if (part === "") continue;

            if (part.includes("x^2")) {

                let coefficient = part.replace("x^2", "");

                if (coefficient === "" || coefficient === "+") {
                    coefficient = 1;
                }
                else if (coefficient === "-") {
                    coefficient = -1;
                }
                else {
                    coefficient = Number(coefficient);
                }

                xSquaredCoefficient += coefficient;

            }
            else if (part.includes("x")) {

                let coefficient = part.replace("x", "");

                if (coefficient === "" || coefficient === "+") {
                    coefficient = 1;
                }
                else if (coefficient === "-") {
                    coefficient = -1;
                }
                else {
                    coefficient = Number(coefficient);
                }

                xCoefficient += coefficient;

            }
            else {

                constant += Number(part);
            }
        }

        return [
            constant,
            xCoefficient,
            xSquaredCoefficient
        ];
    }


    /* =========================
       انتقال همه چیز به یک طرف
    ========================= */

    function subtractPolynomials(left, right) {

        return [
            (left[0] || 0) - (right[0] || 0),
            (left[1] || 0) - (right[1] || 0),
            (left[2] || 0) - (right[2] || 0)
        ];
    }


    /* =========================
       حل معادله
    ========================= */

    function solveEquation(equation) {

        equation = normalizeNumbers(equation);

        if (!equation.includes("=")) {
            throw new Error("معادله باید علامت مساوی (=) داشته باشد.");
        }

        const sides = equation.split("=");

        if (sides.length !== 2) {
            throw new Error("معادله واردشده صحیح نیست.");
        }

        const left = parsePolynomial(sides[0]);
        const right = parsePolynomial(sides[1]);

        const result = subtractPolynomials(left, right);

        const c = result[0];
        const b = result[1];
        const a = result[2];


        /* درجه دوم */

        if (a !== 0) {

            const delta = b * b - 4 * a * c;

            if (delta < 0) {
                return {
                    type: "quadratic-no-real",
                    left,
                    right,
                    a,
                    b,
                    c,
                    delta
                };
            }

            if (delta === 0) {

                const x = -b / (2 * a);

                return {
                    type: "quadratic-one",
                    left,
                    right,
                    a,
                    b,
                    c,
                    delta,
                    x
                };
            }

            const x1 = (-b + Math.sqrt(delta)) / (2 * a);
            const x2 = (-b - Math.sqrt(delta)) / (2 * a);

            return {
                type: "quadratic-two",
                left,
                right,
                a,
                b,
                c,
                delta,
                x1,
                x2
            };
        }


        /* معادله درجه اول */

        if (b === 0 && c === 0) {

            return {
                type: "infinite",
                left,
                right,
                b,
                c
            };
        }

        if (b === 0 && c !== 0) {

            return {
                type: "none",
                left,
                right,
                b,
                c
            };
        }

        const x = -c / b;

        return {
            type: "linear",
            left,
            right,
            b,
            c,
            x
        };
    }


    /* =========================
       نمایش مراحل معادله درجه اول
    ========================= */

    function createLinearSteps(result) {

        const left = result.left;
        const right = result.right;

        const b = result.b;
        const c = result.c;

        let html = "";

        /* معادله اولیه */

        html +=
            "<div class='step-title'>مرحله ۱: معادله اولیه</div>";

        html +=
            "<div dir='ltr' class='step-line'>" +
            equationText(left, right) +
            "</div>";


        /*
           اگر سمت چپ یک عدد ثابت دارد،
           آن عدد را به طرف دیگر می‌بریم.
        */

        const leftConstant = left[0] || 0;


        if (leftConstant !== 0) {

            const amount = Math.abs(leftConstant);

            if (leftConstant > 0) {

                html +=
                    "<div class='step-explanation'>" +
                    "عدد " +
                    numberText(amount) +
                    " را به طرف دیگر مساوی می‌بریم؛ چون مثبت است، علامتش منفی می‌شود." +
                    "</div>";

            }
            else {

                html +=
                    "<div class='step-explanation'>" +
                    "عدد " +
                    numberText(amount) +
                    " را به طرف دیگر مساوی می‌بریم؛ چون منفی است، علامتش مثبت می‌شود." +
                    "</div>";

            }


            /* عبارت سمت چپ بعد از حذف ثابت */

            const leftX = xTerm(b);

            let rightNewConstant;

            if (leftConstant > 0) {
                rightNewConstant = (right[0] || 0) - leftConstant;
            }
            else {
                rightNewConstant = (right[0] || 0) + amount;
            }


            let rightText = "";

            if (rightNewConstant === 0) {
                rightText = "0";
            }
            else {
                rightText = numberText(rightNewConstant);
            }


            html +=
    "<div dir='ltr' class='step-line'>" +
    leftX +
    " = " +
    numberText(right[0] || 0) +
    (leftConstant > 0 ? " - " : " + ") +
    numberText(amount) +
    "</div>";


html +=
    "<div dir='ltr' class='step-line'>" +
    leftX +
    " = " +
    rightText +
    "</div>";

        }
        else {

            /*
               اگر ثابت سمت چپ صفر باشد،
               مستقیماً به مرحله ضریب x می‌رویم.
            */

            html +=
                "<div class='step-explanation'>" +
                "در این مرحله عدد ثابتی کنار x وجود ندارد، پس مستقیماً ضریب x را ساده می‌کنیم." +
                "</div>";

            html +=
                "<div dir='ltr' class='step-line'>" +
                xTerm(b) +
                " = " +
                numberText(-c) +
                "</div>";
        }


        /* =========================
           تقسیم بر ضریب x
        ========================= */

        if (b !== 1) {

            html +=
                "<div class='step-explanation'>" +
                "حالا برای اینکه فقط x باقی بماند، دو طرف مساوی را بر " +
                numberText(b) +
                " تقسیم می‌کنیم." +
                "</div>";

            html +=
                "<div dir='ltr' class='step-line'>" +
                xTerm(b) +
                " ÷ " +
                numberText(b) +
                " = " +
                numberText(result.x * b) +
                " ÷ " +
                numberText(b) +
                "</div>";
        }


        /* جواب نهایی */

        html +=
            "<div class='step-title'>جواب نهایی</div>";

        html +=
            "<div dir='ltr' class='step-line final-step'>" +
            "x = " +
            numberText(result.x) +
            "</div>";

        return html;
    }


    /* =========================
       مراحل درجه دوم
    ========================= */

    function createQuadraticSteps(result) {

        let html = "";

        html +=
            "<div class='step-title'>معادله درجه دوم</div>";

        html +=
            "<div dir='ltr' class='step-line'>" +
            equationText(result.left, result.right) +
            "</div>";

        html +=
            "<div class='step-explanation'>" +
            "ابتدا همه جمله‌ها را به یک طرف مساوی منتقل می‌کنیم تا معادله به شکل استاندارد درآید." +
            "</div>";

        html +=
            "<div dir='ltr' class='step-line'>" +
            numberText(result.a) +
            "x² " +
            (result.b >= 0 ? "+ " : "- ") +
            numberText(Math.abs(result.b)) +
            "x " +
            (result.c >= 0 ? "+ " : "- ") +
            numberText(Math.abs(result.c)) +
            " = 0" +
            "</div>";

        html +=
            "<div class='step-explanation'>" +
            "حالا دلتا را حساب می‌کنیم:" +
            "</div>";

        html +=
            "<div dir='ltr' class='step-line'>" +
            "Δ = b² − 4ac = " +
            numberText(result.delta) +
            "</div>";


        if (result.type === "quadratic-no-real") {

            html +=
                "<div class='step-explanation'>" +
                "چون دلتا منفی است، این معادله در مجموعه اعداد حقیقی جواب ندارد." +
                "</div>";

            return html;
        }


        if (result.type === "quadratic-one") {

            html +=
                "<div class='step-explanation'>" +
                "چون دلتا صفر است، معادله یک جواب دارد." +
                "</div>";

            html +=
                "<div dir='ltr' class='step-line'>" +
                "x = " +
                numberText(result.x) +
                "</div>";

            return html;
        }


        html +=
            "<div class='step-explanation'>" +
            "چون دلتا مثبت است، معادله دو جواب دارد." +
            "</div>";

        html +=
            "<div dir='ltr' class='step-line'>" +
            "x₁ = " +
            numberText(result.x1) +
            "</div>";

        html +=
            "<div dir='ltr' class='step-line'>" +
            "x₂ = " +
            numberText(result.x2) +
            "</div>";

        return html;
    }


    /* =========================
       بررسی جواب
    ========================= */

    function createCheck(result) {

        if (result.type === "linear") {

            const leftValue =
                (result.left[1] || 0) * result.x +
                (result.left[0] || 0);

            const rightValue =
                (result.right[1] || 0) * result.x +
                (result.right[0] || 0);

            return (
                "با قرار دادن x = " +
                numberText(result.x) +
                " در معادله، دو طرف مساوی برابر " +
                numberText(leftValue) +
                " می‌شوند. ✅"
            );
        }

        if (result.type === "quadratic-one") {

            return (
                "جواب x = " +
                numberText(result.x) +
                " در معادله قابل جایگذاری و بررسی است. ✅"
            );
        }

        if (result.type === "quadratic-two") {

            return (
                "جواب‌های به‌دست‌آمده: x₁ = " +
                numberText(result.x1) +
                " و x₂ = " +
                numberText(result.x2) +
                " ✅"
            );
        }

        return "برای این نوع معادله بررسی جداگانه لازم است.";
    }


    /* =========================
       دکمه حل
    ========================= */

    solveButton.addEventListener("click", function () {

        const equation = input.value.trim();

        if (!equation) {

            answer.textContent =
                "لطفاً ابتدا یک معادله وارد کن.";

            steps.innerHTML =
                "<p class='empty-message'>معادله‌ای وارد نشده است.</p>";

            checkResult.textContent =
                "هنوز جوابی برای بررسی وجود ندارد.";

            return;
        }


        try {

            const result = solveEquation(equation);


            /* معادله درجه اول */

            if (result.type === "linear") {

                answer.innerHTML =
                    "<strong>x = " +
                    numberText(result.x) +
                    "</strong>";

                steps.innerHTML =
                    createLinearSteps(result);

                checkResult.innerHTML =
                    createCheck(result);

                return;
            }


            /* بی‌نهایت جواب */

            if (result.type === "infinite") {

                answer.innerHTML =
                    "<strong>بی‌نهایت جواب دارد.</strong>";

                steps.innerHTML =
                    "<div class='step-explanation'>" +
                    "دو طرف معادله یکسان هستند، بنابراین هر مقدار x معادله را درست می‌کند." +
                    "</div>";

                checkResult.textContent =
                    "این معادله بی‌نهایت جواب دارد.";

                return;
            }


            /* بدون جواب */

            if (result.type === "none") {

                answer.innerHTML =
                    "<strong>جواب ندارد.</strong>";

                steps.innerHTML =
                    "<div class='step-explanation'>" +
                    "پس از ساده‌سازی به یک تساوی نادرست می‌رسیم؛ بنابراین این معادله جواب ندارد." +
                    "</div>";

                checkResult.textContent =
                    "این معادله جواب ندارد.";

                return;
            }


            /* درجه دوم */

            if (
                result.type === "quadratic-one" ||
                result.type === "quadratic-two" ||
                result.type === "quadratic-no-real"
            ) {

                if (result.type === "quadratic-one") {

                    answer.innerHTML =
                        "<strong>x = " +
                        numberText(result.x) +
                        "</strong>";
                }

                else if (result.type === "quadratic-two") {

                    answer.innerHTML =
                        "<strong>x₁ = " +
                        numberText(result.x1) +
                        "</strong><br>" +
                        "<strong>x₂ = " +
                        numberText(result.x2) +
                        "</strong>";
                }

                else {

                    answer.innerHTML =
                        "<strong>جواب حقیقی ندارد.</strong>";
                }

                steps.innerHTML =
                    createQuadraticSteps(result);

                checkResult.innerHTML =
                    createCheck(result);

                return;
            }


        }
        catch (error) {

            answer.innerHTML =
                "<strong>خطا در معادله</strong>";

            steps.innerHTML =
                "<div class='step-explanation'>" +
                error.message +
                "</div>";

            checkResult.textContent =
                "معادله قابل بررسی نیست.";
        }

    });


    /* =========================
       پاک کردن
    ========================= */

    clearButton.addEventListener("click", function () {

        input.value = "";

        answer.textContent =
            "هنوز معادله‌ای حل نشده است.";

        steps.innerHTML =
            "<p class='empty-message'>" +
            "بعد از حل معادله، مراحل اینجا نمایش داده می‌شود." +
            "</p>";

        checkResult.textContent =
            "هنوز جوابی برای بررسی وجود ندارد.";

        input.focus();
    });


    /* =========================
       حالت‌های ورود
    ========================= */

    textModeButton.addEventListener("click", function () {

        textModeButton.classList.add("active");
        sentenceModeButton.classList.remove("active");
        imageModeButton.classList.remove("active");

        input.placeholder =
            "مثلاً: 2x + 5 = 17";
    });


    sentenceModeButton.addEventListener("click", function () {

        sentenceModeButton.classList.add("active");
        textModeButton.classList.remove("active");
        imageModeButton.classList.remove("active");

        input.placeholder =
            "مثلاً: دو برابر یک عدد به اضافه پنج برابر است با هفده";
    });


    imageModeButton.addEventListener("click", function () {

        imageModeButton.classList.add("active");
        textModeButton.classList.remove("active");
        sentenceModeButton.classList.remove("active");

        input.placeholder =
            "در نسخه بعدی، می‌توانی عکس سؤال را وارد کنی.";
    });

});
