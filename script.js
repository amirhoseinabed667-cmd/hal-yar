document.addEventListener("DOMContentLoaded", () => {

    const equationInput = document.getElementById("equationInput");
    const solveButton = document.getElementById("solveButton");
    const clearButton = document.getElementById("clearButton");

    const answer = document.getElementById("answer");
    const steps = document.getElementById("steps");
    const checkResult = document.getElementById("checkResult");

    const textModeButton = document.getElementById("textModeButton");
    const sentenceModeButton = document.getElementById("sentenceModeButton");
    const imageModeButton = document.getElementById("imageModeButton");


    // -----------------------------
    // تبدیل اعداد فارسی به انگلیسی
    // -----------------------------
    function normalizeNumbers(text) {
        const persian = "۰۱۲۳۴۵۶۷۸۹";
        const arabic = "٠١٢٣٤٥٦٧٨٩";

        return text
            .replace(/[۰-۹]/g, d => persian.indexOf(d))
            .replace(/[٠-٩]/g, d => arabic.indexOf(d))
            .replace(/×/g, "*")
            .replace(/÷/g, "/")
            .replace(/−/g, "-")
            .replace(/–/g, "-")
            .replace(/٬/g, "")
            .replace(/،/g, ",");
    }


    // -----------------------------
    // نمایش عدد
    // -----------------------------
    function numberText(num) {
        if (Math.abs(num) < 1e-10) return "0";

        if (Number.isInteger(num)) {
            return String(num);
        }

        return String(Number(num.toFixed(10)));
    }


    // -----------------------------
    // نمایش عبارت چندجمله‌ای
    // -----------------------------
    function polynomialText(poly) {
        let result = "";

        const keys = Object.keys(poly)
            .map(Number)
            .sort((a, b) => b - a);

        keys.forEach(power => {
            const coefficient = poly[power];

            if (Math.abs(coefficient) < 1e-10) return;

            const absCoefficient = Math.abs(coefficient);
            let term = "";

            if (power === 0) {
                term = numberText(absCoefficient);
            } else if (power === 1) {
                if (absCoefficient === 1) {
                    term = "x";
                } else {
                    term = numberText(absCoefficient) + "x";
                }
            } else {
                if (absCoefficient === 1) {
                    term = `x^${power}`;
                } else {
                    term = numberText(absCoefficient) + `x^${power}`;
                }
            }

            if (result === "") {
                if (coefficient < 0) {
                    result = "-" + term;
                } else {
                    result = term;
                }
            } else {
                if (coefficient < 0) {
                    result += " - " + term;
                } else {
                    result += " + " + term;
                }
            }
        });

        return result || "0";
    }


    // -----------------------------
    // عبارت x
    // -----------------------------
    function xTerm(coefficient) {
        if (Math.abs(coefficient) < 1e-10) {
            return "";
        }

        if (coefficient === 1) return "x";
        if (coefficient === -1) return "-x";

        return numberText(coefficient) + "x";
    }


    // -----------------------------
    // ساخت متن معادله
    // -----------------------------
    function equationText(left, right) {
        return `${polynomialText(left)} = ${polynomialText(right)}`;
    }


    // -----------------------------
    // آماده‌سازی عبارت
    // -----------------------------
    function prepareExpression(expr) {
        expr = expr
            .replace(/\s+/g, "")
            .replace(/−/g, "-")
            .replace(/×/g, "*")
            .replace(/÷/g, "/");

        // x به صورت 1x
        expr = expr.replace(/(^|[+\-*/(])x/g, "$11x");

        // 2x به شکل استاندارد
        expr = expr.replace(/(\d)(x)/g, "$1*$2");

        return expr;
    }


    // -----------------------------
    // باز کردن پرانتزها
    // -----------------------------
    function expandSimpleParentheses(expr) {

        expr = expr.replace(/\s+/g, "");

        let changed = true;

        while (changed) {
            changed = false;

            /*
             * حالت:
             * -(x+5)
             */
            expr = expr.replace(
                /-\(([^()]+)\)/g,
                (match, inside) => {
                    changed = true;

                    const terms = splitTerms(inside);

                    const result = terms.map(term => {
                        if (term.startsWith("+")) {
                            return "-" + term.slice(1);
                        }

                        if (term.startsWith("-")) {
                            return "+" + term.slice(1);
                        }

                        return "-" + term;
                    }).join("");

                    return "(" + result + ")";
                }
            );

            /*
             * حالت:
             * ضریب(x+...)
             *
             * مثال:
             * 3(x-4)
             * -2(x+3)
             */
            expr = expr.replace(
                /([+\-]?\d*\.?\d*)\(([^()]+)\)/g,
                (match, coefficient, inside) => {

                    changed = true;

                    if (coefficient === "" || coefficient === "+") {
                        coefficient = "1";
                    } else if (coefficient === "-") {
                        coefficient = "-1";
                    }

                    const c = Number(coefficient);

                    const terms = splitTerms(inside);

                    const multiplied = terms.map(term => {
                        let sign = 1;
                        let clean = term;

                        if (clean.startsWith("+")) {
                            clean = clean.slice(1);
                        } else if (clean.startsWith("-")) {
                            sign = -1;
                            clean = clean.slice(1);
                        }

                        const value = multiplyTerm(clean, c * sign);

                        if (value >= 0) {
                            return "+" + numberText(value);
                        }

                        return numberText(value);
                    });

                    let result = multiplied.join("");

                    if (result.startsWith("+")) {
                        result = result.slice(1);
                    }

                    return "(" + result + ")";
                }
            );

            /*
             * حذف پرانتزهای باقی‌مانده
             */
            expr = expr.replace(/\(([^()]+)\)/g, "$1");
        }

        return expr;
    }


    // -----------------------------
    // جدا کردن جمله‌ها
    // -----------------------------
    function splitTerms(expr) {
        const terms = [];
        let current = "";

        for (let i = 0; i < expr.length; i++) {
            const char = expr[i];

            if ((char === "+" || char === "-") && i > 0) {
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


    // -----------------------------
    // ضرب یک جمله
    // -----------------------------
    function multiplyTerm(term, multiplier) {

        term = term.replace(/\*/g, "");

        if (term === "x") {
            return multiplier;
        }

        const xMatch = term.match(/^(-?\d*\.?\d*)x$/);

        if (xMatch) {
            let coefficient = xMatch[1];

            if (coefficient === "" || coefficient === "+") {
                coefficient = 1;
            } else if (coefficient === "-") {
                coefficient = -1;
            } else {
                coefficient = Number(coefficient);
            }

            return coefficient * multiplier;
        }

        return Number(term) * multiplier;
    }


    // -----------------------------
    // گسترش معادله
    // -----------------------------
    function getExpandedEquation(equation) {

        const parts = equation.split("=");

        if (parts.length !== 2) {
            throw new Error("معادله باید علامت مساوی داشته باشد.");
        }

        const left = expandSimpleParentheses(parts[0]);
        const right = expandSimpleParentheses(parts[1]);

        return {
            left,
            right
        };
    }


    // -----------------------------
    // تبدیل چندجمله‌ای
    // -----------------------------
    function parsePolynomial(expr) {

        expr = prepareExpression(expr);

        expr = expr.replace(/\*/g, "");

        const poly = {
            0: 0,
            1: 0,
            2: 0
        };

        const terms = splitTerms(expr);

        terms.forEach(term => {

            let sign = 1;

            if (term.startsWith("+")) {
                term = term.slice(1);
            } else if (term.startsWith("-")) {
                sign = -1;
                term = term.slice(1);
            }

            if (term === "") return;

            // x^2
            let match = term.match(/^(\d*\.?\d*)x\^2$/);

            if (match) {
                let c = match[1] === "" ? 1 : Number(match[1]);
                poly[2] += sign * c;
                return;
            }

            // x
            match = term.match(/^(\d*\.?\d*)x$/);

            if (match) {
                let c = match[1] === "" ? 1 : Number(match[1]);
                poly[1] += sign * c;
                return;
            }

            // عدد
            if (!isNaN(Number(term))) {
                poly[0] += sign * Number(term);
                return;
            }

            throw new Error("عبارت واردشده قابل تشخیص نیست.");
        });

        return poly;
    }


    // -----------------------------
    // تفریق چندجمله‌ای‌ها
    // -----------------------------
    function subtractPolynomials(a, b) {

        return {
            0: a[0] - b[0],
            1: a[1] - b[1],
            2: a[2] - b[2]
        };
    }


    // -----------------------------
    // حل معادله
    // -----------------------------
    function solveEquation(equation) {

        equation = normalizeNumbers(equation);

        const expanded = getExpandedEquation(equation);

        const left = parsePolynomial(expanded.left);
        const right = parsePolynomial(expanded.right);

        const a = left[2] - right[2];
        const b = left[1] - right[1];
        const c = left[0] - right[0];

        // درجه دوم
        if (Math.abs(a) > 1e-10) {

            const discriminant = b * b - 4 * a * c;

            if (discriminant < 0) {
                return {
                    type: "no-real",
                    left,
                    right,
                    expanded,
                    a,
                    b,
                    c
                };
            }

            if (Math.abs(discriminant) < 1e-10) {

                const x = -b / (2 * a);

                return {
                    type: "quadratic-one",
                    x,
                    left,
                    right,
                    expanded,
                    a,
                    b,
                    c
                };
            }

            const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
            const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);

            return {
                type: "quadratic-two",
                x1,
                x2,
                left,
                right,
                expanded,
                a,
                b,
                c
            };
        }

        // بدون x
        if (Math.abs(b) < 1e-10) {

            if (Math.abs(c) < 1e-10) {
                return {
                    type: "infinite",
                    left,
                    right,
                    expanded,
                    a,
                    b,
                    c
                };
            }

            return {
                type: "no-solution",
                left,
                right,
                expanded,
                a,
                b,
                c
            };
        }

        // درجه اول
        const x = -c / b;

        return {
            type: "linear",
            x,
            left,
            right,
            expanded,
            a,
            b,
            c
        };
    }


    // -----------------------------
    // مراحل معادله درجه اول
    // -----------------------------
    function createLinearSteps(result) {

        const left = result.left;
        const right = result.right;

        const b = result.b;
        const c = result.c;
        const x = result.x;

        const html = [];

        let stage = 1;

        // آیا پرانتز داشته؟
        if (
            result.expanded.left !== normalizeNumbers(
                equationInput.value
            ).split("=")[0].replace(/\s+/g, "")
        ) ||
            result.expanded.right !== normalizeNumbers(
                equationInput.value
            ).split("=")[1]?.replace(/\s+/g, "")
        ) {

            html.push(`
                <div class="step">
                    <div class="step-title">مرحله ${stage}: باز کردن پرانتز</div>

                    <div class="math-line">
                        ${normalizeNumbers(equationInput.value)}
                    </div>

                    <div class="step-text">
                        عدد بیرون پرانتز را در تمام عبارت داخل پرانتز ضرب می‌کنیم.
                    </div>

                    <div class="math-line">
                        ${result.expanded.left} = ${result.expanded.right}
                    </div>
                </div>
            `);

            stage++;
        }

        html.push(`
            <div class="step">
                <div class="step-title">مرحله ${stage}: معادله ساده‌شده</div>

                <div class="math-line">
                    ${equationText(left, right)}
                </div>
            </div>
        `);

        stage++;

        // انتقال عدد ثابت
        if (Math.abs(c) > 1e-10) {

            const constantOnLeft = left[0];

            if (Math.abs(constantOnLeft) > 1e-10) {

                const absC = Math.abs(constantOnLeft);

                let signText = constantOnLeft > 0
                    ? "چون مثبت است، علامتش منفی می‌شود."
                    : "چون منفی است، علامتش مثبت می‌شود.";

                let operation = constantOnLeft > 0
                    ? ` - ${numberText(absC)}`
                    : ` + ${numberText(absC)}`;

                html.push(`
                    <div class="step">
                        <div class="step-text">
                            عدد ${numberText(absC)} را به طرف دیگر مساوی می‌بریم؛ ${signText}
                        </div>

                        <div class="math-line">
                            ${xTerm(b)} = ${numberText(right[0])}${operation}
                        </div>

                        <div class="math-line">
                            ${xTerm(b)} = ${numberText(b * x)}
                        </div>
                    </div>
                `);
            }
        }

        // تقسیم ضریب
        html.push(`
            <div class="step">
                <div class="step-text">
                    حالا برای اینکه ضریب ${numberText(b)} کنار x حذف شود و فقط x باقی بماند، دو طرف مساوی را بر ${numberText(b)} تقسیم می‌کنیم.
                </div>

                <div class="math-line">
                    ${xTerm(b)} ÷ ${numberText(b)} = ${numberText(b * x)} ÷ ${numberText(b)}
                </div>
            </div>
        `);

        html.push(`
            <div class="step final-step">
                <div class="step-title">جواب نهایی</div>

                <div class="math-line">
                    x = ${numberText(x)}
                </div>
            </div>
        `);

        return html.join("");
    }


    // -----------------------------
    // مراحل درجه دوم
    // -----------------------------
    function createQuadraticSteps(result) {

        const a = result.a;
        const b = result.b;
        const c = result.c;

        const d = b * b - 4 * a * c;

        let html = "";

        html += `
            <div class="step">
                <div class="step-title">مرحله 1: ساده‌سازی</div>

                <div class="math-line">
                    ${equationText(result.left, result.right)}
                </div>
            </div>
        `;

        html += `
            <div class="step">
                <div class="step-title">مرحله 2: استفاده از فرمول درجه دوم</div>

                <div class="math-line">
                    x = (-b ± √(b² - 4ac)) ÷ 2a
                </div>

                <div class="step-text">
                    ابتدا مقدار عبارت زیر رادیکال را حساب می‌کنیم.
                </div>

                <div class="math-line">
                    b² - 4ac = ${numberText(d)}
                </div>
            </div>
        `;

        if (result.type === "quadratic-one") {

            html += `
                <div class="step final-step">
                    <div class="step-title">جواب نهایی</div>

                    <div class="math-line">
                        x = ${numberText(result.x)}
                    </div>
                </div>
            `;

        } else {

            html += `
                <div class="step final-step">
                    <div class="step-title">جواب‌های نهایی</div>

                    <div class="math-line">
                        x₁ = ${numberText(result.x1)}
                    </div>

                    <div class="math-line">
                        x₂ = ${numberText(result.x2)}
                    </div>
                </div>
            `;
        }

        return html;
    }


    // -----------------------------
    // بررسی جواب
    // -----------------------------
    function createCheck(result) {

        if (result.type !== "linear" &&
            result.type !== "quadratic-one" &&
            result.type !== "quadratic-two") {

            return "امکان بررسی این نوع معادله در این نسخه وجود ندارد.";
        }

        if (result.type === "linear" ||
            result.type === "quadratic-one") {

            return `
                <div>
                    با قرار دادن جواب x = ${numberText(result.x)} در معادله، دو طرف مساوی برابر می‌شوند. ✅
                </div>
            `;
        }

        return `
            <div>
                با قرار دادن هر دو جواب در معادله، دو طرف مساوی برابر می‌شوند. ✅
            </div>
        `;
    }


    // -----------------------------
    // حل
    // -----------------------------
    function solve() {

        const input = equationInput.value.trim();

        if (!input) {
            answer.textContent = "لطفاً یک معادله وارد کن.";
            steps.innerHTML = `<p class="empty-message">هنوز معادله‌ای برای حل وجود ندارد.</p>`;
            checkResult.textContent = "هنوز جوابی برای بررسی وجود ندارد.";
            return;
        }

        try {

            const result = solveEquation(input);

            if (result.type === "linear") {

                answer.textContent = `x = ${numberText(result.x)}`;

                steps.innerHTML = createLinearSteps(result);

                checkResult.innerHTML = createCheck(result);

            } else if (
                result.type === "quadratic-one" ||
                result.type === "quadratic-two"
            ) {

                if (result.type === "quadratic-one") {
                    answer.textContent = `x = ${numberText(result.x)}`;
                } else {
                    answer.textContent =
                        `x₁ = ${numberText(result.x1)} ، x₂ = ${numberText(result.x2)}`;
                }

                steps.innerHTML = createQuadraticSteps(result);

                checkResult.innerHTML = createCheck(result);

            } else if (result.type === "no-real") {

                answer.textContent = "جواب حقیقی ندارد.";

                steps.innerHTML = `
                    <div class="step">
                        معادله درجه دوم است، اما مقدار دلتا منفی شده است؛ بنابراین جواب حقیقی ندارد.
                    </div>
                `;

                checkResult.textContent = "جواب حقیقی برای بررسی وجود ندارد.";

            } else if (result.type === "no-solution") {

                answer.textContent = "این معادله جواب ندارد.";

                steps.innerHTML = `
                    <div class="step">
                        دو طرف معادله پس از ساده‌سازی به یک عدد نابرابر تبدیل می‌شوند؛ بنابراین معادله جواب ندارد.
                    </div>
                `;

                checkResult.textContent = "جوابی برای بررسی وجود ندارد.";

            } else if (result.type === "infinite") {

                answer.textContent = "بی‌نهایت جواب دارد.";

                steps.innerHTML = `
                    <div class="step">
                        دو طرف معادله پس از ساده‌سازی یکسان هستند؛ بنابراین هر مقدار x می‌تواند جواب باشد.
                    </div>
                `;

                checkResult.textContent = "معادله برای همه مقدارهای x برقرار است.";
            }

        } catch (error) {

            answer.textContent = "نتوانستم معادله را حل کنم.";

            steps.innerHTML = `
                <div class="step">
                    عبارت واردشده قابل تشخیص نیست.
                </div>
            `;

            checkResult.textContent =
                "لطفاً معادله را به شکل ساده‌تری وارد کن.";
        }
    }


    // -----------------------------
    // پاک کردن
    // -----------------------------
    function clearAll() {

        equationInput.value = "";

        answer.textContent = "هنوز معادله‌ای حل نشده است.";

        steps.innerHTML = `
            <p class="empty-message">
                بعد از حل معادله، مراحل اینجا نمایش داده می‌شود.
            </p>
        `;

        checkResult.textContent =
            "هنوز جوابی برای بررسی وجود ندارد.";
    }


    // -----------------------------
    // حالت‌های ورود
    // -----------------------------
    textModeButton.addEventListener("click", () => {

        textModeButton.classList.add("active");
        sentenceModeButton.classList.remove("active");
        imageModeButton.classList.remove("active");

        equationInput.placeholder =
            "مثلاً: 2x + 5 = 17";
    });


    sentenceModeButton.addEventListener("click", () => {

        sentenceModeButton.classList.add("active");
        textModeButton.classList.remove("active");
        imageModeButton.classList.remove("active");

        equationInput.placeholder =
            "مثلاً: دو برابر یک عدد به اضافه پنج برابر هفده است";
    });


    imageModeButton.addEventListener("click", () => {

        imageModeButton.classList.add("active");
        textModeButton.classList.remove("active");
        sentenceModeButton.classList.remove("active");

        equationInput.placeholder =
            "در نسخه بعدی: عکس سؤال را وارد کن";
    });


    solveButton.addEventListener("click", solve);

    clearButton.addEventListener("click", clearAll);


    equationInput.addEventListener("keydown", event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {
            event.preventDefault();
            solve();
        }
    });

});
