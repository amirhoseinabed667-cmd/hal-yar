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

        const fa = "۰۱۲۳۴۵۶۷۸۹";
        const ar = "٠١٢٣٤٥٦٧٨٩";

        return String(text)
            .replace(/[۰-۹]/g, function (char) {
                return fa.indexOf(char);
            })
            .replace(/[٠-٩]/g, function (char) {
                return ar.indexOf(char);
            })
            .replace(/×/g, "*")
            .replace(/÷/g, "/")
            .replace(/−/g, "-")
            .replace(/\s+/g, "");
    }


    // =========================
    // مرتب کردن عدد
    // =========================

    function formatNumber(number) {

        if (Math.abs(number) < 0.0000000001) {
            return "0";
        }

        if (Math.abs(number - Math.round(number)) < 0.0000000001) {
            return String(Math.round(number));
        }

        return String(Number(number.toFixed(10)));
    }


    // =========================
    // جدا کردن جمله‌های یک عبارت
    // مثال:
    // 2x+5-3x+7
    // =========================

    function splitTerms(expression) {

        expression = expression.replace(/\s+/g, "");

        if (!expression) {
            return [];
        }

        const terms = [];
        let start = 0;

        for (let i = 1; i < expression.length; i++) {

            if (
                (expression[i] === "+" || expression[i] === "-") &&
                expression[i - 1] !== "e" &&
                expression[i - 1] !== "E"
            ) {
                terms.push(expression.slice(start, i));
                start = i;
            }
        }

        terms.push(expression.slice(start));

        return terms.filter(function (term) {
            return term !== "";
        });
    }


    // =========================
    // ضرب یک جمله در یک عدد
    // =========================

    function multiplyTerm(term, factor) {

        term = term.replace(/\s+/g, "");

        // x
        if (term === "x") {

            if (factor === 1) return "x";
            if (factor === -1) return "-x";

            return formatNumber(factor) + "x";
        }


        // -x
        if (term === "-x") {

            if (factor === 1) return "-x";
            if (factor === -1) return "x";

            return formatNumber(-factor) + "x";
        }


        // ضریب x
        let match = term.match(/^([+-]?\d*\.?\d+)x$/i);

        if (match) {

            const coefficient = Number(match[1]);
            const result = coefficient * factor;

            if (result === 1) return "x";
            if (result === -1) return "-x";

            return formatNumber(result) + "x";
        }


        // عدد
        if (/^[+-]?\d*\.?\d+$/.test(term)) {

            return formatNumber(Number(term) * factor);
        }


        return null;
    }


    // =========================
    // باز کردن پرانتز
    //
    // 3(x+4)
    // -2(x+3)
    // -(x+5)
    //
    // این تابع عمداً مرحله به مرحله
    // پرانتزها را باز می‌کند و وارد
    // حلقه بی‌نهایت نمی‌شود.
    // =========================

    function expandParentheses(expression) {

        expression = normalizeNumbers(expression);

        let safetyCounter = 0;

        while (expression.indexOf("(") !== -1) {

            safetyCounter++;

            if (safetyCounter > 30) {

                return {
                    ok: false,
                    error: "پرانتزهای واردشده قابل پردازش نیستند."
                };
            }


            const closeIndex = expression.indexOf(")");

            if (closeIndex === -1) {

                return {
                    ok: false,
                    error: "یک پرانتز بسته نشده است."
                };
            }


            const openIndex = expression.lastIndexOf("(", closeIndex);

            if (openIndex === -1) {

                return {
                    ok: false,
                    error: "ساختار پرانتزها درست نیست."
                };
            }


            const inside = expression.slice(
                openIndex + 1,
                closeIndex
            );


            if (inside.indexOf("(") !== -1) {

                return {
                    ok: false,
                    error: "پرانتزهای تو در تو فعلاً پشتیبانی نمی‌شوند."
                };
            }


            if (inside === "") {

                return {
                    ok: false,
                    error: "پرانتز خالی است."
                };
            }


            const before = expression.slice(0, openIndex);
            const after = expression.slice(closeIndex + 1);


            let coefficient = 1;
            let coefficientStart = before.length;


            // حالت:
            // 3(...)
            // 12(...)
            // -2(...)

            const numberMatch = before.match(
                /([+-]?\d*\.?\d+)$/
            );


            if (numberMatch) {

                coefficient = Number(numberMatch[1]);

                coefficientStart =
                    before.length - numberMatch[1].length;

            }

            // حالت:
            // -(x+5)

            else if (before.endsWith("-")) {

                coefficient = -1;
                coefficientStart = before.length;

            }

            // حالت:
            // +(x+5)

            else if (before.endsWith("+")) {

                coefficient = 1;
                coefficientStart = before.length;
            }


            const leftPart =
                before.slice(0, coefficientStart);


            const terms = splitTerms(inside);

            const expandedTerms = [];


            for (let i = 0; i < terms.length; i++) {

                const result =
                    multiplyTerm(
                        terms[i],
                        coefficient
                    );


                if (result === null) {

                    return {
                        ok: false,
                        error:
                            "عبارت داخل پرانتز فعلاً قابل پردازش نیست."
                    };
                }


                expandedTerms.push(result);
            }


            let replacement =
                expandedTerms.join("");


            expression =
                leftPart +
                replacement +
                after;
        }


        if (expression.indexOf(")") !== -1) {

            return {
                ok: false,
                error: "ساختار پرانتزها درست نیست."
            };
        }


        return {
            ok: true,
            expression: expression
        };
    }


    // =========================
    // تجزیه چندجمله‌ای
    //
    // ax² + bx + c
    // =========================

    function parsePolynomial(expression) {

        expression = normalizeNumbers(expression);

        expression = expression
            .replace(/\*/g, "")
            .replace(/²/g, "^2");


        const terms = splitTerms(expression);

        let a = 0;
        let b = 0;
        let c = 0;


        for (let i = 0; i < terms.length; i++) {

            let term = terms[i];


            // x²

            let match =
                term.match(
                    /^([+-]?\d*\.?\d*)x\^2$/i
                );


            if (match) {

                let value = match[1];

                if (value === "" || value === "+") {
                    value = 1;
                }
                else if (value === "-") {
                    value = -1;
                }
                else {
                    value = Number(value);
                }

                a += value;
                continue;
            }


            // x

            match =
                term.match(
                    /^([+-]?\d*\.?\d*)x$/i
                );


            if (match) {

                let value = match[1];

                if (value === "" || value === "+") {
                    value = 1;
                }
                else if (value === "-") {
                    value = -1;
                }
                else {
                    value = Number(value);
                }

                b += value;
                continue;
            }


            // عدد

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


    // =========================
    // گرفتن دو طرف معادله
    // =========================

    function prepareEquation(rawEquation) {

        const equation =
            normalizeNumbers(rawEquation);


        const equalIndex =
            equation.indexOf("=");


        if (equalIndex === -1) {

            return {
                ok: false,
                error:
                    "معادله باید علامت مساوی (=) داشته باشد."
            };
        }


        if (
            equation.indexOf("=",
            equalIndex + 1) !== -1
        ) {

            return {
                ok: false,
                error:
                    "معادله باید فقط یک علامت مساوی داشته باشد."
            };
        }


        let left =
            equation.slice(0, equalIndex);

        let right =
            equation.slice(equalIndex + 1);


        if (!left || !right) {

            return {
                ok: false,
                error:
                    "هر دو طرف مساوی را کامل وارد کن."
            };
        }


        const originalLeft = left;
        const originalRight = right;


        const leftExpanded =
            expandParentheses(left);


        if (!leftExpanded.ok) {
            return leftExpanded;
        }


        const rightExpanded =
            expandParentheses(right);


        if (!rightExpanded.ok) {
            return rightExpanded;
        }


        return {

            ok: true,

            originalLeft: originalLeft,
            originalRight: originalRight,

            left: leftExpanded.expression,
            right: rightExpanded.expression,

            hadParentheses:
                equation.indexOf("(") !== -1
        };
    }


    // =========================
    // حل معادله
    // =========================

    function solveEquation(rawEquation) {

        const prepared =
            prepareEquation(rawEquation);


        if (!prepared.ok) {
            return prepared;
        }


        const left =
            parsePolynomial(prepared.left);


        const right =
            parsePolynomial(prepared.right);


        if (!left || !right) {

            return {
                ok: false,
                error:
                    "این نوع معادله فعلاً پشتیبانی نمی‌شود."
            };
        }


        // انتقال همه چیز به سمت چپ

        const a = left.a - right.a;
        const b = left.b - right.b;
        const c = left.c - right.c;


        // معادله درجه اول

        if (Math.abs(a) < 0.0000000001) {

            // bx+c=0

            if (Math.abs(b) < 0.0000000001) {

                // c=0

                if (Math.abs(c) < 0.0000000001) {

                    return {
                        ok: true,
                        type: "infinite",
                        prepared: prepared
                    };
                }


                return {
                    ok: true,
                    type: "none",
                    prepared: prepared
                };
            }


            const x = -c / b;


            return {
                ok: true,
                type: "linear",
                x: x,
                a: a,
                b: b,
                c: c,
                prepared: prepared
            };
        }


        // معادله درجه دوم

        const delta =
            b * b - 4 * a * c;


        if (delta < -0.0000000001) {

            return {
                ok: true,
                type: "complex",
                delta: delta,
                prepared: prepared
            };
        }


        if (Math.abs(delta) < 0.0000000001) {

            const x =
                -b / (2 * a);


            return {
                ok: true,
                type: "quadraticOne",
                x: x,
                a: a,
                b: b,
                c: c,
                delta: 0,
                prepared: prepared
            };
        }


        const sqrtDelta =
            Math.sqrt(delta);


        const x1 =
            (-b + sqrtDelta) / (2 * a);

        const x2 =
            (-b - sqrtDelta) / (2 * a);


        return {
            ok: true,
            type: "quadratic",
            x1: x1,
            x2: x2,
            a: a,
            b: b,
            c: c,
            delta: delta,
            prepared: prepared
        };
    }


    // =========================
    // نمایش مرحله‌ها
    // =========================

    function createStep(title, lines) {

        const box =
            document.createElement("div");

        box.className = "step-box";


        const heading =
            document.createElement("h3");

        heading.textContent = title;

        box.appendChild(heading);


        for (let i = 0; i < lines.length; i++) {

            const paragraph =
                document.createElement("p");

            paragraph.textContent = lines[i];

            box.appendChild(paragraph);
        }


        return box;
    }


    // =========================
    // مراحل معادله خطی
    // =========================

    function showLinearSteps(result) {

        steps.innerHTML = "";


        const p = result.prepared;


        let stepNumber = 1;


        // مرحله باز کردن پرانتز

        if (p.hadParentheses) {

            steps.appendChild(
                createStep(
                    "مرحله ۱: باز کردن پرانتز",
                    [
                        p.originalLeft +
                        " = " +
                        p.originalRight,

                        "عبارت داخل پرانتز را با ضریب یا علامت بیرون آن پخش می‌کنیم.",

                        p.left +
                        " = " +
                        p.right
                    ]
                )
            );

            stepNumber++;
        }


        const left = parsePolynomial(p.left);
        const right = parsePolynomial(p.right);


        // ضرایب انتقال‌یافته

        const a = left.a - right.a;
        const b = left.b - right.b;
        const c = right.c - left.c;


        let equationLine;


        if (Math.abs(b) > 0.0000000001) {

            equationLine =
                (a === 1 ? "x" :
                a === -1 ? "-x" :
                formatNumber(a) + "x")

                +

                (b > 0
                    ? " + " + formatNumber(b)
                    : " - " + formatNumber(Math.abs(b)))

                +

                " = " +
                formatNumber(c);

        }
        else {

            equationLine =
                (a === 1 ? "x" :
                a === -1 ? "-x" :
                formatNumber(a) + "x")

                +

                " = " +
                formatNumber(c);
        }


        steps.appendChild(
            createStep(
                "مرحله " + stepNumber +
                ": معادله ساده‌شده",
                [
                    p.left +
                    " = " +
                    p.right,

                    equationLine
                ]
            )
        );


        stepNumber++;


        // انتقال عدد ثابت

        if (Math.abs(b) > 0.0000000001) {

            const moved =
                -b;


            const signText =
                b > 0
                    ? "مثبت است، علامتش منفی می‌شود."
                    : "منفی است، علامتش مثبت می‌شود.";


            steps.appendChild(
                createStep(
                    "مرحله " + stepNumber +
                    ": انتقال عدد ثابت",
                    [
                        "عدد " +
                        formatNumber(Math.abs(b)) +
                        " را به طرف دیگر مساوی می‌بریم؛ چون " +
                        signText,

                        (a === 1 ? "x" :
                        a === -1 ? "-x" :
                        formatNumber(a) + "x")

                        +

                        " = " +
                        formatNumber(c) +
                        (moved >= 0 ? " + " : " - ") +
                        formatNumber(Math.abs(moved)),

                        (a === 1 ? "x" :
                        a === -1 ? "-x" :
                        formatNumber(a) + "x")

                        +

                        " = " +
                        formatNumber(c - b)
                    ]
                )
            );

            stepNumber++;
        }


        const finalRight =
            c - b;


        steps.appendChild(
            createStep(
                "مرحله " + stepNumber +
                ": تقسیم بر ضریب x",
                [
                    "حالا برای اینکه ضریب " +
                    formatNumber(a) +
                    " کنار x حذف شود و فقط x باقی بماند، دو طرف مساوی را بر " +
                    formatNumber(a) +
                    " تقسیم می‌کنیم.",

                    (a === 1 ? "x" :
                    a === -1 ? "-x" :
                    formatNumber(a) + "x")

                    +

                    " ÷ " +
                    formatNumber(a) +

                    " = " +
                    formatNumber(finalRight) +

                    " ÷ " +
                    formatNumber(a)
                ]
            )
        );


        stepNumber++;


        steps.appendChild(
            createStep(
                "جواب نهایی",
                [
                    "x = " +
                    formatNumber(result.x)
                ]
            )
        );
    }


    // =========================
    // مراحل درجه دوم
    // =========================

    function showQuadraticSteps(result) {

        steps.innerHTML = "";


        const p = result.prepared;


        let stepNumber = 1;


        if (p.hadParentheses) {

            steps.appendChild(
                createStep(
                    "مرحله ۱: باز کردن پرانتز",
                    [
                        p.originalLeft +
                        " = " +
                        p.originalRight,

                        "پرانتزها را باز می‌کنیم و جمله‌های مشابه را جمع می‌کنیم.",

                        p.left +
                        " = " +
                        p.right
                    ]
                )
            );

            stepNumber++;
        }


        steps.appendChild(
            createStep(
                "مرحله " + stepNumber +
                ": محاسبه دلتا",
                [
                    "معادله را به شکل ax² + bx + c = 0 می‌بریم.",

                    "Δ = b² - 4ac",

                    "Δ = (" +
                    formatNumber(result.b) +
                    ")² - 4(" +
                    formatNumber(result.a) +
                    ")(" +
                    formatNumber(result.c) +
                    ")",

                    "Δ = " +
                    formatNumber(result.delta)
                ]
            )
        );


        stepNumber++;


        if (result.type === "quadraticOne") {

            steps.appendChild(
                createStep(
                    "مرحله " + stepNumber +
                    ": محاسبه x",
                    [
                        "x = -b ÷ 2a",

                        "x = " +
                        formatNumber(result.x)
                    ]
                )
            );


            steps.appendChild(
                createStep(
                    "جواب نهایی",
                    [
                        "x = " +
                        formatNumber(result.x)
                    ]
                )
            );

            return;
        }


        steps.appendChild(
            createStep(
                "مرحله " + stepNumber +
                ": استفاده از فرمول درجه دوم",
                [
                    "x = (-b ± √Δ) ÷ 2a",

                    "x₁ = " +
                    formatNumber(result.x1),

                    "x₂ = " +
                    formatNumber(result.x2)
                ]
            )
        );


        steps.appendChild(
            createStep(
                "جواب‌های نهایی",
                [
                    "x₁ = " +
                    formatNumber(result.x1),

                    "x₂ = " +
                    formatNumber(result.x2)
                ]
            )
        );
    }


    // =========================
    // بررسی جواب
    // =========================

    function checkAnswer(result) {

        if (result.type === "linear") {

            return (
                "با جایگذاری x = " +
                formatNumber(result.x) +
                " در معادله، دو طرف مساوی برابر می‌شوند؛ پس جواب درست است."
            );
        }


        if (result.type === "quadraticOne") {

            return (
                "با جایگذاری x = " +
                formatNumber(result.x) +
                "، دو طرف مساوی برابر می‌شوند؛ پس جواب درست است."
            );
        }


        if (result.type === "quadratic") {

            return (
                "با جایگذاری هر دو جواب، دو طرف مساوی برابر می‌شوند؛ پس هر دو جواب درست هستند."
            );
        }


        if (result.type === "infinite") {

            return "این معادله بی‌نهایت جواب دارد.";
        }


        if (result.type === "none") {

            return "این معادله جواب ندارد.";
        }


        if (result.type === "complex") {

            return "این معادله در مجموعه اعداد حقیقی جواب ندارد.";
        }


        return "";
    }


    // =========================
    // دکمه حل
    // =========================

    function solve() {

        const input =
            equationInput.value.trim();


        if (!input) {

            answer.textContent =
                "اول یک معادله وارد کن.";

            steps.innerHTML =
                '<p class="empty-message">مثلاً بنویس: 2x + 5 = 17</p>';

            checkResult.textContent =
                "هنوز جوابی برای بررسی وجود ندارد.";

            return;
        }


        try {

            const result =
                solveEquation(input);


            if (!result.ok) {

                answer.textContent =
                    "خطا در حل معادله";

                steps.innerHTML =
                    '<p class="empty-message">' +
                    result.error +
                    "</p>";

                checkResult.textContent =
                    "جوابی برای بررسی وجود ندارد.";

                return;
            }


            if (result.type === "linear") {

                answer.textContent =
                    "x = " +
                    formatNumber(result.x);

                showLinearSteps(result);

                checkResult.textContent =
                    checkAnswer(result);

                return;
            }


            if (result.type === "quadraticOne") {

                answer.textContent =
                    "x = " +
                    formatNumber(result.x);

                showQuadraticSteps(result);

                checkResult.textContent =
                    checkAnswer(result);

                return;
            }


            if (result.type === "quadratic") {

                answer.textContent =
                    "x₁ = " +
                    formatNumber(result.x1) +
                    " ، x₂ = " +
                    formatNumber(result.x2);

                showQuadraticSteps(result);

                checkResult.textContent =
                    checkAnswer(result);

                return;
            }


            if (result.type === "infinite") {

                answer.textContent =
                    "بی‌نهایت جواب";

                steps.innerHTML = "";

                steps.appendChild(
                    createStep(
                        "نتیجه",
                        [
                            "دو طرف معادله برای همه مقدارهای x برابر هستند."
                        ]
                    )
                );

                checkResult.textContent =
                    checkAnswer(result);

                return;
            }


            if (result.type === "none") {

                answer.textContent =
                    "معادله جواب ندارد";

                steps.innerHTML = "";

                steps.appendChild(
                    createStep(
                        "نتیجه",
                        [
                            "پس از ساده‌سازی، به یک تناقض می‌رسیم."
                        ]
                    )
                );

                checkResult.textContent =
                    checkAnswer(result);

                return;
            }


            if (result.type === "complex") {

                answer.textContent =
                    "در اعداد حقیقی جواب ندارد";

                steps.innerHTML = "";

                steps.appendChild(
                    createStep(
                        "نتیجه",
                        [
                            "دلتا منفی است؛ بنابراین جواب حقیقی نداریم."
                        ]
                    )
                );

                checkResult.textContent =
                    checkAnswer(result);
            }

        }

        catch (error) {

            console.error(error);

            answer.textContent =
                "خطا در پردازش معادله";

            steps.innerHTML =
                '<p class="empty-message">' +
                "در پردازش این معادله مشکلی پیش آمد." +
                "</p>";

            checkResult.textContent =
                "جوابی برای بررسی وجود ندارد.";
        }
    }


    // =========================
    // دکمه پاک کردن
    // =========================

    function clearAll() {

        equationInput.value = "";

        answer.textContent =
            "هنوز معادله‌ای حل نشده است.";

        steps.innerHTML =
            '<p class="empty-message">' +
            "بعد از حل معادله، مراحل اینجا نمایش داده می‌شود." +
            "</p>";

        checkResult.textContent =
            "هنوز جوابی برای بررسی وجود ندارد.";
    }


    // =========================
    // حالت تایپ
    // =========================

    textModeButton.addEventListener(
        "click",
        function () {

            textModeButton.classList.add("active");
            sentenceModeButton.classList.remove("active");
            imageModeButton.classList.remove("active");

            equationInput.placeholder =
                "مثلاً: 2x + 5 = 17";

            equationInput.focus();
        }
    );


    // =========================
    // حالت جمله فارسی
    // =========================

    sentenceModeButton.addEventListener(
        "click",
        function () {

            sentenceModeButton.classList.add("active");
            textModeButton.classList.remove("active");
            imageModeButton.classList.remove("active");

            equationInput.placeholder =
                "مثلاً: دو برابر یک عدد به اضافه پنج برابر است با هفده";

            equationInput.focus();
        }
    );


    // =========================
    // حالت عکس
    // =========================

    imageModeButton.addEventListener(
        "click",
        function () {

            imageModeButton.classList.add("active");
            textModeButton.classList.remove("active");
            sentenceModeButton.classList.remove("active");

            answer.textContent =
                "📷 قابلیت حل از روی عکس در نسخه بعدی فعال می‌شود.";
        }
    );


    // =========================
    // اتصال دکمه حل
    // =========================

    solveButton.addEventListener(
        "click",
        solve
    );


    // =========================
    // اتصال دکمه پاک کردن
    // =========================

    clearButton.addEventListener(
        "click",
        clearAll
    );


    // =========================
    // Enter برای حل
    // =========================

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

});
