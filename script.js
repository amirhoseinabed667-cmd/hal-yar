/* =========================================================
   حل‌یار — موتور حل معادله
   نسخه ۱
   ========================================================= */

const input = document.getElementById("equationInput");
const solveButton = document.getElementById("solveButton");
const clearButton = document.getElementById("clearButton");

const answerBox = document.getElementById("answer");
const stepsBox = document.getElementById("steps");
const checkBox = document.getElementById("checkResult");

const textModeButton = document.getElementById("textModeButton");
const sentenceModeButton = document.getElementById("sentenceModeButton");
const imageModeButton = document.getElementById("imageModeButton");

const EPS = 1e-10;


/* =========================================================
   تبدیل اعداد و علامت‌های فارسی
   ========================================================= */

function normalizeInput(value) {
    return value
        .replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
        .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/[−–]/g, "-")
        .replace(/٫/g, ".")
        .replace(/,/g, ".")
        .replace(/²/g, "^2")
        .replace(/³/g, "^3")
        .replace(/X/g, "x")
        .replace(/ایکس/gi, "x")
        .replace(/\s+/g, "");
}


/* =========================================================
   ابزارهای عددی
   ========================================================= */

function cleanNumber(n) {
    if (Math.abs(n) < EPS) return 0;
    return Number(n.toFixed(10));
}

function formatNumber(n) {
    n = cleanNumber(n);

    if (Number.isInteger(n)) {
        return String(n);
    }

    return String(n);
}


/* =========================================================
   چندجمله‌ای
   [عدد ثابت، ضریب x، ضریب x²]
   ========================================================= */

function trimPoly(p) {
    const out = p.map(cleanNumber);

    while (
        out.length > 1 &&
        Math.abs(out[out.length - 1]) < EPS
    ) {
        out.pop();
    }

    return out;
}

function addPoly(a, b) {
    const n = Math.max(a.length, b.length);
    const result = [];

    for (let i = 0; i < n; i++) {
        result[i] = (a[i] || 0) + (b[i] || 0);
    }

    return trimPoly(result);
}

function subPoly(a, b) {
    const n = Math.max(a.length, b.length);
    const result = [];

    for (let i = 0; i < n; i++) {
        result[i] = (a[i] || 0) - (b[i] || 0);
    }

    return trimPoly(result);
}

function mulPoly(a, b) {
    const result = Array(
        a.length + b.length - 1
    ).fill(0);

    for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < b.length; j++) {
            result[i + j] += a[i] * b[j];
        }
    }

    if (
        result.length > 3 &&
        result.slice(3).some(
            value => Math.abs(value) > EPS
        )
    ) {
        throw new Error(
            "فعلاً معادلات با توان بالاتر از ۲ پشتیبانی نمی‌شوند."
        );
    }

    return trimPoly(result);
}

function divPoly(a, b) {
    if (
        b.length !== 1 ||
        Math.abs(b[0]) < EPS
    ) {
        throw new Error(
            "در این نسخه، مخرج باید یک عدد ثابتِ غیرصفر باشد."
        );
    }

    return trimPoly(
        a.map(value => value / b[0])
    );
}

function powPoly(a, exponent) {
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
        result = mulPoly(result, a);
    }

    return result;
}


/* =========================================================
   تبدیل چندجمله‌ای به متن
   ========================================================= */

function polynomialText(p) {
    const terms = [];

    for (let i = p.length - 1; i >= 0; i--) {

        const coefficient = cleanNumber(
            p[i] || 0
        );

        if (coefficient === 0) {
            continue;
        }

        const absolute = Math.abs(coefficient);

        let term;

        if (i === 0) {
            term = formatNumber(absolute);
        }

        else if (i === 1) {
            term =
                absolute === 1
                    ? "x"
                    : `${formatNumber(absolute)}x`;
        }

        else {
            term =
                absolute === 1
                    ? "x²"
                    : `${formatNumber(absolute)}x²`;
        }

        if (terms.length === 0) {

            terms.push(
                coefficient < 0
                    ? "-" + term
                    : term
            );

        } else {

            terms.push(
                coefficient < 0
                    ? " - " + term
                    : " + " + term
            );
        }
    }

    return terms.length
        ? terms.join("")
        : "0";
}


/* =========================================================
   Tokenizer
   ========================================================= */

function tokenize(str) {

    const tokens = [];

    let i = 0;

    while (i < str.length) {

        const ch = str[i];

        /* عدد */

        if (/[0-9.]/.test(ch)) {

            let number = "";
            let dots = 0;

            while (
                i < str.length &&
                /[0-9.]/.test(str[i])
            ) {

                if (str[i] === ".") {
                    dots++;
                }

                number += str[i];
                i++;
            }

            if (
                dots
