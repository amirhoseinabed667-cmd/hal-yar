document.addEventListener("DOMContentLoaded", function () {

    // =========================
    // عناصر صفحه
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
    // تبدیل اعداد فارسی و عربی
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
    // نمایش عدد
    // =========================

    function formatNumber(number) {

        if (Math.abs(number) < 0.0000000001) {
            return "0";
        }

        if (
            Math.abs(number - Math.round(number)) <
            0.0000000001
        ) {
            return String(Math.round(number));
        }

        return String(Number(number.toFixed(10)));
    }


    // =========================
    // جدا کردن جمله‌های عبارت
    // =========================

    function splitTerms(expression) {

        expression =
            String(expression).replace(/\s+/g, "");

        if (!expression) {
            return [];
        }

        const terms = [];
        let start = 0;

        for (
            let i = 1;
            i < expression.length;
            i++
        ) {

            if (
                (expression[i] === "+" ||
                 expression[i] === "-") &&
                expression[i - 1] !== "e" &&
                expression[i - 1] !== "E"
            ) {

                terms.push(
                    expression.slice(start, i)
                );

                start = i;
            }
        }

        terms.push(
            expression.slice(start)
        );

        return terms.filter(function (term) {
            return term !== "";
        });
    }


    // =========================
    // ضرب یک جمله در عدد
    // =========================

    function multiplyTerm(term, factor) {

        term =
            term.replace(/\s+/g, "");


        // x

        if (term === "x") {

            if (factor === 1) {
                return "x";
            }

            if (factor === -1) {
                return "-x";
            }

            return (
                formatNumber(factor) +
                "x"
            );
        }


        // -x

        if (term === "-x") {

            if (factor === 1) {
                return "-x";
            }

            if (factor === -1) {
                return "x";
            }

            return (
                formatNumber(-factor) +
                "x"
            );
        }


        // عدد ضربدر x

        let match =
            term.match(
                /^([+-]?\d*\.?\d+)x$/i
            );


        if (match) {

            const coefficient =
                Number(match[1]);

            const result =
                coefficient * factor;


            if (result === 1) {
                return "x";
            }

            if (result === -1) {
                return "-x";
            }

            return (
                formatNumber(result) +
                "x"
            );
        }


        // عدد

        if (
            /^[+-]?\d*\.?\d+$/.test(term)
        ) {

            return formatNumber(
                Number(term) * factor
            );
        }


        return null;
    }


    // =========================
    // باز کردن پرانتز
    // =========================

    function expandParentheses(expression) {

        expression =
            normalizeNumbers(expression);

        let safety = 0;


        while (expression.includes("(")) {

            safety++;


            // جلوگیری از حلقه بی‌نهایت

            if (safety > 30) {

                return {
                    ok: false,
                    error:
                        "ساختار پرانتزها قابل پردازش نیست."
                };
            }


            const closeIndex =
                expression.indexOf(")");


            if (closeIndex === -1) {

                return {
                    ok: false,
                    error:
                        "یک پرانتز بسته نشده است."
                };
            }


            const openIndex =
                expression.lastIndexOf(
                    "(",
                    closeIndex
                );


            if (openIndex === -1) {

                return {
                    ok: false,
                    error:
                        "ساختار پرانتزها درست نیست."
                };
            }


            const inside =
                expression.slice(
                    openIndex + 1,
                    closeIndex
                );


            if (!inside) {

                return {
                    ok: false,
                    error:
                        "پرانتز خالی است."
                };
            }


            const before =
                expression.slice(
                    0,
                    openIndex
                );


            const after =
                expression.slice(
                    closeIndex + 1
                );


            let factor = 1;

            let factorStart =
                before.length;


            // 3(x+4)
            // -2(x+4)
            // 12(x+4)

            const numberMatch =
                before.match(
                    /([+-]?\d*\.?\d+)$/
                );


            if (numberMatch) {

                factor =
                    Number(numberMatch[1]);

                factorStart =
                    before.length -
                    numberMatch[1].length;
            }


            // -(x+4)

            else if (
                before.endsWith("-")
            ) {

                factor = -1;

                factorStart =
                    before.length;
            }


            // +(x+4)

            else if (
                before.endsWith("+")
            ) {

                factor = 1;

                factorStart =
                    before.length;
            }


            const leftPart =
                before.slice(
                    0,
                    factorStart
                );


            const terms =
                splitTerms(inside);


            const expandedTerms = [];


            for (
                let i = 0;
                i < terms.length;
                i++
            ) {

                const result =
                    multiplyTerm(
                        terms[i],
                        factor
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


            expression =
                leftPart +
                expandedTerms.join("") +
                after;
        }


        if (expression.includes(")")) {

            return {
                ok: false,
                error:
                    "ساختار پرانتزها درست نیست."
            };
        }


        return {
            ok: true,
            expression: expression
        };
    }


    // =========================
    // تجزیه چندجمله‌ای
    // ax² + bx + c
    // =========================

    function parsePolynomial(expression) {

        expression =
            normalizeNumbers(expression)
                .replace(/\*/g, "")
                .replace(/²/g, "^2");


        const terms =
            splitTerms(expression);


        let a = 0;
        let b = 0;
        let c = 0;


        for (
            let i = 0;
            i < terms.length;
            i++
        ) {

            const term =
                terms[i];


            // x²

            let match =
                term.match(
                    /^([+-]?\d*\.?\d*)x\^2$/i
                );


            if (match) {

                let value =
                    match[1];


                if (
                    value === "" ||
                    value === "+"
                ) {
                    value = 1;
                }

                else if (
                    value === "-"
                ) {
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

                let value =
                    match[1];


                if (
                    value === "" ||
                    value === "+"
                ) {
                    value = 1;
                }

                else if (
                    value === "-"
                ) {
                    value = -1;
                }

                else {
                    value = Number(value);
                }


                b += value;

                continue;
            }


            // عدد

            if (
                /^[+-]?\d*\.?\d+$/.test(term)
            ) {

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
    // آماده‌سازی معادله
    // =========================

    function prepareEquation(raw) {

        const equation =
            normalizeNumbers(raw);


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
            equation.indexOf(
                "=",
                equalIndex + 1
            ) !== -1
        ) {

            return {
                ok: false,
                error:
                    "معادله باید فقط یک علامت مساوی داشته باشد."
            };
        }


        const originalLeft =
            equation.slice(
                0,
                equalIndex
            );


        const originalRight =
            equation.slice(
                equalIndex + 1
            );


        if (
            !originalLeft ||
            !originalRight
        ) {

            return {
                ok: false,
                error:
                    "هر دو طرف مساوی را کامل وارد کن."
            };
        }


        const left =
            expandParentheses(
                originalLeft
            );


        if (!left.ok) {
            return left;
        }


        const right =
            expandParentheses(
                originalRight
            );


        if (!right.ok) {
            return right;
        }


        return {

            ok: true,

            originalLeft:
                originalLeft,

            originalRight:
                originalRight,

            left:
                left.expression,

            right:
                right.expression,

            hadParentheses:
                equation.includes("(")
        };
    }


    // =========================
    // حل معادله
    // =========================

    function solveEquation(raw) {

        const prepared =
            prepareEquation(raw);


        if (!prepared.ok) {
            return prepared;
        }


        const left =
            parsePolynomial(
                prepared.left
            );


        const right =
            parsePolynomial(
                prepared.right
            );


        if (!left || !right) {

            return {
                ok: false,
                error:
                    "این نوع معادله فعلاً پشتیبانی نمی‌شود."
            };
        }


        // انتقال همه جمله‌ها به سمت چپ

        const a =
            left.a - right.a;

        const b =
            left.b - right.b;

        const c =
            left.c - right.c;


        // معادله درجه اول

        if (
            Math.abs(a) < 0.0000000001
        ) {

            if (
                Math.abs(b) <
                0.0000000001
            ) {

                if (
                    Math.abs(c) <
                    0.0000000001
                ) {

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


            return {

                ok: true,

                type: "linear",

                x:
                    -c / b,

                a: a,
                b: b,
                c: c,

                prepared:
                    prepared
            };
        }


        // درجه دوم

        const delta =
            b * b -
            4 * a * c;


        if (
            delta < -0.0000000001
        ) {

            return {

                ok: true,

                type: "complex",

                delta:
                    delta,

                prepared:
                    prepared
            };
        }


        if (
            Math.abs(delta) <
            0.0000000001
        ) {

            return {

                ok: true,

                type: "quadraticOne",

                x:
                    -b / (2 * a),

                a: a,
                b: b,
                c: c,

                delta: 0,

                prepared:
                    prepared
            };
        }


        const sqrtDelta =
            Math.sqrt(delta);


        return {

            ok: true,

            type: "quadratic",

            x1:
                (-b + sqrtDelta) /
                (2 * a),

            x2:
                (-b - sqrtDelta) /
                (2 * a),

            a: a,
            b: b,
            c: c,

            delta:
                delta,

            prepared:
                prepared
        };
    }


    // =========================
    // ساخت یک مرحله
    // =========================

    function addStep(title, lines) {

        const box =
            document.createElement(
                "div"
            );

        box.className =
            "step-box";


        const heading =
            document.createElement(
                "h3"
            );

        heading.textContent =
            title;


        box.appendChild(
            heading
        );


        lines.forEach(
            function (line) {

                const paragraph =
                    document.createElement(
                        "p"
                    );

                paragraph.textContent =
                    line;


                box.appendChild(
                    paragraph
                );
            }
        );


        steps.appendChild(
            box
        );
    }


    // =========================
    // مراحل معادله درجه اول
    // =========================

    function showLinearSteps(result) {

        steps.innerHTML = "";


        const p =
            result.prepared;


        let stepNumber = 1;


        // پرانتز

        if (p.hadParentheses) {

            addStep(
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
            );


            stepNumber++;
        }


        const left =
            parsePolynomial(
                p.left
            );


        const right =
            parsePolynomial(
                p.right
            );


        const a =
            left.a -
            right.a;


        const b =
            left.b -
            right.b;


        const c =
            right.c -
            left.c;


        let simplified;


        if (
            Math.abs(b) >
            0.0000000001
        ) {

            simplified =
                (
                    a === 1
                        ? "x"
                        : a === -1
                            ? "-x"
                            : formatNumber(a) + "x"
                )

                +

                (
                    b > 0
                        ? " + " +
                          formatNumber(b)
                        : " - " +
                          formatNumber(
                              Math.abs(b)
                          )
                )

                +

                " = " +
                formatNumber(c);

        }

        else {

            simplified =
                (
                    a === 1
                        ? "x"
                        : a === -1
                            ? "-x"
                            : formatNumber(a) + "x"
                )

                +

                " = " +
                formatNumber(c);
        }


        addStep(
            "مرحله " +
            stepNumber +
            ": معادله ساده‌شده",

            [
                p.left +
                " = " +
                p.right,

                simplified
            ]
        );


        stepNumber++;


        // انتقال عدد ثابت

        if (
            Math.abs(b) >
            0.0000000001
        ) {

            addStep(
                "مرحله " +
                stepNumber +
                ": انتقال عدد ثابت",

                [
                    "عدد " +
                    formatNumber(
                        Math.abs(b)
                    ) +
                    " را به طرف دیگر مساوی می‌بریم؛ چون " +
                    (
                        b > 0
                            ? "مثبت است، علامتش منفی می‌شود."
                            : "منفی است، علامتش مثبت می‌شود."
                    ),

                    (
                        a === 1
                            ? "x"
                            : a === -1
                                ? "-x"
                                : formatNumber(a) + "x"
                    )

                    +

                    " = " +

                    formatNumber(
                        c - b
                    )
                ]
            );


            stepNumber++;
        }


        // تقسیم بر ضریب x

        addStep(
            "مرحله " +
            stepNumber +
            ": تقسیم بر ضریب x",

            [
                "حالا برای اینکه ضریب " +
                formatNumber(a) +
                " کنار x حذف شود و فقط x باقی بماند، دو طرف مساوی را بر " +
                formatNumber(a) +
                " تقسیم می‌کنیم.",

                (
                    a === 1
                        ? "x"
                        : a === -1
                            ? "-x"
                            : formatNumber(a) + "x"
                )

                +

                " ÷ " +
                formatNumber(a) +

                " = " +

                formatNumber(c - b) +

                " ÷ " +

                formatNumber(a)
            ]
        );


        stepNumber++;


        addStep(
            "جواب نهایی",

            [
                "x = " +
                formatNumber(result.x)
            ]
        );
    }


    // =========================
    // مراحل درجه دوم
    // =========================

    function showQuadraticSteps(result) {

        steps.innerHTML = "";


        const p =
            result.prepared;


        let stepNumber = 1;


        if (p.hadParentheses) {

            addStep(
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
            );


            stepNumber++;
        }


        addStep(
            "مرحله " +
            stepNumber +
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
        );


        stepNumber++;


        if (
            result.type ===
            "quadraticOne"
        ) {

            addStep(
                "مرحله " +
                stepNumber +
                ": محاسبه x",

                [
                    "x = -b ÷ 2a",

                    "x = " +
                    formatNumber(result.x)
                ]
            );


            addStep(
                "جواب نهایی",

                [
                    "x = " +
                    formatNumber(result.x)
                ]
            );


            return;
        }


        addStep(
            "مرحله " +
            stepNumber +
            ": استفاده از فرمول درجه دوم",

            [
                "x = (-b ± √Δ) ÷ 2a",

                "x₁ = " +
                formatNumber(result.x1),

                "x₂ = " +
                formatNumber(result.x2)
            ]
        );


        addStep(
            "جواب‌های نهایی",

            [
                "x₁ = " +
                formatNumber(result.x1),

                "x₂ = " +
                formatNumber(result.x2)
            ]
        );
    }


    // =========================
    // حل
    // =========================

    function solve() {

        const raw =
            equationInput.value.trim();


        if (!raw) {

            answer.textContent =
                "اول یک معادله وارد کن.";


            steps.innerHTML =
                '<p class="empty-message">' +
                "مثلاً بنویس: 2x + 5 = 17" +
                "</p>";


            checkResult.textContent =
                "هنوز جوابی برای بررسی وجود ندارد.";


            return;
        }


        try {

            const result =
                solveEquation(raw);


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


            // درجه اول

            if (
                result.type ===
                "linear"
            ) {

                answer.textContent =
                    "x = " +
                    formatNumber(
                        result.x
                    );


                showLinearSteps(
                    result
                );


                checkResult.textContent =
                    "با جایگذاری x = " +
                    formatNumber(
                        result.x
                    ) +
                    "، دو طرف مساوی برابر می‌شوند؛ پس جواب درست است.";


                return;
            }


            // درجه دوم با یک جواب

            if (
                result.type ===
                "quadraticOne"
            ) {

                answer.textContent =
                    "x = " +
                    formatNumber(
                        result.x
                    );


                showQuadraticSteps(
                    result
                );


                checkResult.textContent =
                    "با جایگذاری جواب، دو طرف مساوی برابر می‌شوند؛ پس جواب درست است.";


                return;
            }


            // درجه دوم با دو جواب

            if (
                result.type ===
                "quadratic"
            ) {

                answer.textContent =
                    "x₁ = " +
                    formatNumber(
                        result.x1
                    ) +
                    " ، x₂ = " +
                    formatNumber(
                        result.x2
                    );


                showQuadraticSteps(
                    result
                );


                checkResult.textContent =
                    "با جایگذاری هر دو جواب، دو طرف مساوی برابر می‌شوند؛ پس هر دو جواب درست هستند.";


                return;
            }


            // بی‌نهایت جواب

            if (
                result.type ===
                "infinite"
            ) {

                answer.textContent =
                    "بی‌نهایت جواب";


                steps.innerHTML = "";


                addStep(
                    "نتیجه",

                    [
                        "دو طرف معادله برای همه مقدارهای x برابر هستند."
                    ]
                );


                checkResult.textContent =
                    "این معادله بی‌نهایت جواب دارد.";


                return;
            }


            // بدون جواب

            if (
                result.type ===
                "none"
            ) {

                answer.textContent =
                    "معادله جواب ندارد";


                steps.innerHTML = "";


                addStep(
                    "نتیجه",

                    [
                        "پس از ساده‌سازی، به یک تناقض می‌رسیم."
                    ]
                );


                checkResult.textContent =
                    "این معادله جواب ندارد.";


                return;
            }


            // جواب حقیقی ندارد

            if (
                result.type ===
                "complex"
            ) {

                answer.textContent =
                    "در اعداد حقیقی جواب ندارد";


                steps.innerHTML = "";


                addStep(
                    "نتیجه",

                    [
                        "دلتا منفی است؛ بنابراین جواب حقیقی نداریم."
                    ]
                );


                checkResult.textContent =
                    "این معادله در مجموعه اعداد حقیقی جواب ندارد.";
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
    // پاک کردن
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

            textModeButton.classList.add(
                "active"
            );

            sentenceModeButton.classList.remove(
                "active"
            );

            imageModeButton.classList.remove(
                "active"
            );


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

            sentenceModeButton.classList.add(
                "active"
            );

            textModeButton.classList.remove(
                "active"
            );

            imageModeButton.classList.remove(
                "active"
            );


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

            imageModeButton.classList.add(
                "active"
            );

            textModeButton.classList.remove(
                "active"
            );

            sentenceModeButton.classList.remove(
                "active"
            );


            answer.textContent =
                "📷 قابلیت حل از روی عکس در نسخه بعدی فعال می‌شود.";
        }
    );


    // =========================
    // اتصال دکمه‌ها
    // =========================

    solveButton.addEventListener(
        "click",
        solve
    );


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
