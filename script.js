document.addEventListener("DOMContentLoaded", function () {

    const input = document.getElementById("equationInput");
    const solveButton = document.getElementById("solveButton");
    const clearButton = document.getElementById("clearButton");

    const answer = document.getElementById("answer");
    const steps = document.getElementById("steps");
    

    const textModeButton = document.getElementById("textModeButton");
    const sentenceModeButton = document.getElementById("sentenceModeButton");
    const imageModeButton = document.getElementById("imageModeButton");


    /* =========================
       تبدیل اعداد فارسی
    ========================= */

    function normalizeNumbers(text) {

        const persian = "۰۱۲۳۴۵۶۷۸۹";
        const arabic = "٠١٢٣٤٥٦٧٨٩";

        return text
            .replace(/[۰-۹]/g, d => persian.indexOf(d))
            .replace(/[٠-٩]/g, d => arabic.indexOf(d))
            .replace(/×/g, "*")
            .replace(/÷/g, "/")
            .replace(/−/g, "-")
            .replace(/²/g, "^2")
            .replace(/³/g, "^3")
            .replace(/\s+/g, "");
    }


    function numberText(number) {

    if (Math.abs(number) < 0.0000001) {
        return "0";
    }

    const rounded = Math.round(number);

    if (Math.abs(number - rounded) < 0.00001) {
        return String(rounded);
    }

    if (Number.isInteger(number)) {
        return String(number);
    }

    return String(Number(number.toFixed(6)));
}

function decimalToFraction(number) {

    const tolerance = 0.000001;

    let sign = number < 0 ? -1 : 1;
    number = Math.abs(number);

    let numerator = 1;
    let denominator = 1;

    let bestNumerator = 1;
    let bestDenominator = 1;
    let bestError = Math.abs(number - 1);

    for (let d = 1; d <= 1000; d++) {

        let n = Math.round(number * d);
        let error = Math.abs(number - n / d);

        if (error < bestError) {

            bestError = error;
            bestNumerator = n;
            bestDenominator = d;

        }

        if (error < tolerance) {
            break;
        }
    }

    numerator = bestNumerator * sign;
    denominator = bestDenominator;

    if (denominator === 1) {
        return String(numerator);
    }

    return numerator + "/" + denominator;
}



    /* =========================
       نمایش چندجمله‌ای
    ========================= */

    function polynomialText(poly) {

        const c = poly[0] || 0;
        const b = poly[1] || 0;
        const a = poly[2] || 0;

        let text = "";

        if (a !== 0) {

            if (a === 1) {
                text += "x²";
            }
            else if (a === -1) {
                text += "-x²";
            }
            else {
    text += decimalToFraction(a) + "x²";
}
        }

        if (b !== 0) {

            if (text !== "") {

                if (b > 0) {
                    text += " + ";
                }
                else {
                    text += " - ";
                }

                const absB = Math.abs(b);

                if (absB === 1) {
                    text += "x";
                }
                else {
    text += decimalToFraction(absB) + "x";
}

            }
            else {

                if (b === 1) {
                    text += "x";
                }
                else if (b === -1) {
                    text += "-x";
                }
                else {
    text += decimalToFraction(b) + "x";
}
            }
        }

        if (c !== 0) {

            if (text !== "") {

                if (c > 0) {
                    text += " + " + decimalToFraction(c);
                }
                else {
                    text += " - " + decimalToFraction(Math.abs(c));
                }

            }
            else {
                text += decimalToFraction(c);
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

    return fractionText(coefficient) + "x";
}


    function equationText(left, right) {

        return polynomialText(left) + " = " + polynomialText(right);
    }


    /* =========================
       آماده‌سازی عبارت
    ========================= */

    function prepareExpression(expression) {

        expression = expression
            .replace(/\[/g, "(")
            .replace(/\]/g, ")")
            .replace(/\{/g, "(")
            .replace(/\}/g, ")");

        return expression;
    }


    /* =========================
       باز کردن پرانتزهای ساده
    ========================= */

    function expandSimpleParentheses(expression) {

        expression = prepareExpression(expression);

        let changed = true;

        while (changed) {

            changed = false;

            /*
               الگوی:

               2(x+3)
               2(x-3)
               -2(x+3)
               -2(x-3)
            */

            const pattern =
    /([+-]?\d*(?:\.\d+)?)\(([^()]+)\)/;

            const match = expression.match(pattern);

            if (match) {

                let multiplierText = match[1];

let multiplier;

if (multiplierText === "" || multiplierText === "+") {
    multiplier = 1;
}
else if (multiplierText === "-") {
    multiplier = -1;
}
else {
    multiplier = Number(multiplierText);
}
                const hasLeadingPlus =
    multiplierText.startsWith("+");
                const inside = match[2];

                const parts = splitTerms(inside);

                let expanded = "";

                parts.forEach(function (term, index) {

                    const value = multiplyTerm(term, multiplier);

                    if (index === 0) {
                        expanded += value;
                    }
                    else if (value.startsWith("-")) {
                        expanded += value;
                    }
                    else {
                        expanded += "+" + value;
                    }
                });
if (hasLeadingPlus && !expanded.startsWith("-")) {
    expanded = "+" + expanded;
}
                expression =
    expression.substring(0, match.index) +
    expanded +
    expression.substring(match.index + match[0].length);

                changed = true;
            }
        }

        return expression;
    }


    function splitTerms(expression) {

        expression = expression.replace(/-/g, "+-");

        return expression
            .split("+")
            .filter(x => x !== "");
    }


    function multiplyTerm(term, multiplier) {

        if (term.includes("x^2")) {

            let coefficient =
                term.replace("x^2", "");

            if (coefficient === "" || coefficient === "+") {
                coefficient = 1;
            }
            else if (coefficient === "-") {
                coefficient = -1;
            }
            else {
                coefficient = Number(coefficient);
            }

            return numberText(coefficient * multiplier) + "x^2";
        }

if (term.includes("x/")) {

    let coefficient =
        term.replace("x/", "");

    const denominator = Number(coefficient);

    if (denominator === 0) {
        return term;
    }

    const result = multiplier / denominator;

if (result === 1) return "x";
if (result === -1) return "-x";

return String(result) + "x";
}
        if (term.includes("x")) {

            let coefficient =
                term.replace("x", "");

            if (coefficient === "" || coefficient === "+") {
                coefficient = 1;
            }
            else if (coefficient === "-") {
                coefficient = -1;
            }
            else {
                coefficient = Number(coefficient);
            }

            const result = coefficient * multiplier;

            if (result === 1) return "x";
            if (result === -1) return "-x";

            return String(result) + "x";
        }


        return String(Number(term) * multiplier);
    }


    /* =========================
       تشخیص باز شدن پرانتز
    ========================= */

    function getExpandedEquation(original) {

        const sides = original.split("=");

        if (sides.length !== 2) {
            return null;
        }

        const leftExpanded =
            expandSimpleParentheses(sides[0]);

        const rightExpanded =
            expandSimpleParentheses(sides[1]);

        const originalClean =
            sides[0] + "=" + sides[1];

        const expandedClean =
            leftExpanded + "=" + rightExpanded;

        if (originalClean !== expandedClean) {

            return {
                left: leftExpanded,
                right: rightExpanded
            };
        }

        return null;
    }

function convertSimpleFractions(expression) {

    expression = expression.replace(
        /([+-]?\d*\.?\d*)x\/(\d*\.?\d+)/g,
        function(match, coefficient, denominator) {

            let c;

            if (coefficient === "" || coefficient === "+") {
                c = 1;
            }
            else if (coefficient === "-") {
                c = -1;
            }
            else {
                c = Number(coefficient);
            }

            const d = Number(denominator);

            if (d === 0) {
                return match;
            }

            const value = c / d;
return value + "x";
        }
    );

    return expression;
}

    /* =========================
       تبدیل عبارت به چندجمله‌ای
    ========================= */
    
function convertParenthesesDivision(expression) {

    return expression.replace(
        /\(([^()]+)\)\/(\d*\.?\d+)/g,
        function(match, inside, denominator) {

            const d = Number(denominator);

            if (d === 0) {
                return match;
            }

            const multiplier = 1 / d;

            return multiplier + "(" + inside + ")";
        }
    );

}

function parsePolynomial(expression) {

    expression = convertParenthesesDivision(expression);

    expression = expandSimpleParentheses(expression);

    expression = expression.replace(/-/g, "+-");

    const parts =
        expression.split("+").filter(x => x !== "");

    let constant = 0;
    let xCoefficient = 0;
    let xSquaredCoefficient = 0;
    let xCubedCoefficient = 0;

    for (let part of parts) {

        if (part.includes("x^3")) {

            let coefficient =
                part.replace("x^3", "");

            if (coefficient === "") {
                coefficient = 1;
            }
            else if (coefficient === "-") {
                coefficient = -1;
            }
            else {
                coefficient = Number(coefficient);
            }

            xCubedCoefficient += coefficient;

        }
        else if (part.includes("x^2")) {

            let coefficient =
                part.replace("x^2", "");

            if (coefficient === "") {
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

            let coefficient =
                part.replace("x", "");

            if (coefficient === "") {
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
        xSquaredCoefficient,
        xCubedCoefficient
    ];
}

    /* =========================
       تفریق دو چندجمله‌ای
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
            throw new Error(
                "معادله باید علامت مساوی (=) داشته باشد."
            );
        }

        const sides = equation.split("=");

        if (sides.length !== 2) {
            throw new Error(
                "معادله واردشده صحیح نیست."
            );
        }

const leftExpression =
    convertSimpleFractions(sides[0]);

const rightExpression =
    convertSimpleFractions(sides[1]);

const left =
    parsePolynomial(leftExpression);

const right =
    parsePolynomial(rightExpression);

        const result =
            subtractPolynomials(left, right);

const c = result[0];
const b = result[1];
const a = result[2];
const d = result[3];

if (d !== 0) {

    return {
        type: "cubic",
        left,
        right,
        d,
        a,
        b,
        c
    };
}


        if (a !== 0) {

            const delta =
                b * b - 4 * a * c;

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

                const x =
                    -b / (2 * a);

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

            const x1 =
                (-b + Math.sqrt(delta)) /
                (2 * a);

            const x2 =
                (-b - Math.sqrt(delta)) /
                (2 * a);

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


        const rawX = -c / b;

const x =
    Math.abs(rawX - Math.round(rawX)) < 0.00001
        ? Math.round(rawX)
        : rawX;

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
   مراحل معادله درجه اول
========================= */

function createLinearSteps(result, expandedInfo) {

    const left = result.left;
    const right = result.right;

    let b = result.b;
    let c = result.c;

    let html = "";

    let stage = 1;


    /*
       مرحله باز کردن پرانتز
    */

    if (expandedInfo) {

        html +=
            "<div class='step-title'>" +
            "مرحله " + stage + ": باز کردن پرانتز" +
            "</div>";

        html +=
            "<div dir='ltr' class='step-line'>" +
            expandedInfo.original +
            "</div>";

        html +=
            "<div class='step-explanation'>" +
            expandedInfo.explanation +
            "</div>";

        html +=
            "<div dir='ltr' class='step-line'>" +
            expandedInfo.expanded +
            "</div>";

        stage++;
    }


    /*
       معادله اولیه / ساده‌شده
    */

    html +=
        "<div class='step-title'>" +
        "مرحله " + stage + ": معادله " +
        (expandedInfo ? "ساده‌شده" : "اولیه") +
        "</div>";

    html +=
        "<div dir='ltr' class='step-line'>" +
        equationText(left, right) +
        "</div>";

    stage++;


    /*
       انتقال x از سمت راست به سمت چپ
    */

    const rightX = right[1] || 0;
    const rightConstant = right[0] || 0;
    const leftConstant = left[0] || 0;

    if (rightX !== 0) {

        const newB = b;

        html +=
            "<div class='step-explanation'>" +
            "جمله‌ی دارای x را به طرف دیگر مساوی می‌بریم؛ چون " +
            (rightX > 0
                ? "مثبت است، علامتش منفی می‌شود."
                : "منفی است، علامتش مثبت می‌شود.") +
            "</div>";

 html +=
    "<div dir='ltr' class='step-line'>" +
    xTerm(left[1]) +
    (rightX > 0 ? " - " : " + ") +
    xTerm(Math.abs(rightX)) +
    " + " +
    fractionText(leftConstant) +
    " = " +
    fractionText(rightConstant) +
    "</div>";

html +=
    "<div dir='ltr' class='step-line'>" +
    xTerm(newB) +
    " + " +
    fractionText(leftConstant) +
    " = " +
    fractionText(rightConstant) +
    "</div>";
    }


        /*
       انتقال ثابت
    */

    if (leftConstant !== 0) {

        const amount =
            Math.abs(leftConstant);

        if (leftConstant > 0) {

            html +=
                "<div class='step-explanation'>" +
                "عدد " +
                fractionText(amount) +
                " را به طرف دیگر مساوی می‌بریم؛ چون مثبت است، علامتش منفی می‌شود." +
                "</div>";

        }
        else {

            html +=
                "<div class='step-explanation'>" +
                "عدد " +
                fractionText(amount) +
                " را به طرف دیگر مساوی می‌بریم؛ چون منفی است، علامتش مثبت می‌شود." +
                "</div>";
        }


        let newRight;

        if (leftConstant > 0) {
            newRight =
                rightConstant - amount;
        }
        else {
            newRight =
                rightConstant + amount;
        }


        html +=
            "<div dir='ltr' class='step-line'>" +
            xTerm(b) +
            " = " +
            fractionText(rightConstant) +
            (leftConstant > 0
                ? " - "
                : " + ") +
            fractionText(amount) +
            "</div>";


        html +=
            "<div dir='ltr' class='step-line'>" +
            xTerm(b) +
            " = " +
            fractionText(newRight) +
            "</div>";

    }
    else {

        html +=
            "<div dir='ltr' class='step-line'>" +
            xTerm(b) +
            " = " +
            numberText(-c) +
            "</div>";
    }

    /*
       تقسیم بر ضریب x
    */

        if (b !== 1) {

        html +=
    "<div class='step-explanation'>" +
    "حالا برای اینکه ضریب " +
    fractionText(b) +
    " کنار x حذف شود و فقط x باقی بماند، " +
    "دو طرف مساوی را بر " +
    fractionText(b) +
    " تقسیم می‌کنیم." +
    "</div>";

        const calculatedValue = result.x * b;

        const rightValue =
            Math.abs(calculatedValue - Math.round(calculatedValue)) < 0.0000001
                ? Math.round(calculatedValue)
                : calculatedValue;

        html +=
            "<div dir='ltr' class='step-line'>" +
            xTerm(b) +
            " ÷ " +
            fractionText(b) +
            " = " +
            fractionText(rightValue) +
            " ÷ " +
            fractionText(b) +
            "</div>";
    }


    html +=
        "<div class='step-title'>جواب نهایی</div>";

    let finalAnswer;

if (Number.isInteger(result.x)) {

    finalAnswer =
        "x = " +
        result.x;

}
else {

    finalAnswer =
        "x = " +
        fractionText(result.x) +
        " ≈ " +
        numberText(result.x);

}


html +=
    "<div dir='ltr' class='step-line final-step'>" +
    finalAnswer +
    "</div>";

    return html;
}


    /* =========================
       ساخت مرحله پرانتز
    ========================= */

    function createExpansionInfo(equation) {

        const sides =
            equation.split("=");

        const leftOriginal =
            sides[0];

        const rightOriginal =
            sides[1];

const leftExpanded =
    leftOriginal.replace(
        /\(([^()]+)\)\/(\d*\.?\d+)/g,
        "(1/$2)($1)"
    );

const rightExpanded =
    rightOriginal.replace(
        /\(([^()]+)\)\/(\d*\.?\d+)/g,
        "(1/$2)($1)"
    );


        if (
            leftOriginal === leftExpanded &&
            rightOriginal === rightExpanded
        ) {
            return null;
        }


        let explanation =
    "ابتدا عبارت‌های داخل پرانتز را بر عدد کنار پرانتز تقسیم می‌کنیم.";


        return {
            original:
                leftOriginal + " = " + rightOriginal,

            expanded:
                leftExpanded + " = " + rightExpanded,

            explanation
        };
    }

function fractionText(number) {

    if (Math.abs(number) < 0.0000001) {
        return "0";
    }

    const sign = number < 0 ? "-" : "";
    number = Math.abs(number);

    for (let denominator = 1; denominator <= 1000; denominator++) {

        const numerator = Math.round(number * denominator);

        if (Math.abs(number - numerator / denominator) < 0.0000001) {

            if (denominator === 1) {
                return sign + numerator;
            }

            return sign + numerator + "/" + denominator;
        }
    }

    return numberText(number);
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
    fractionText(result.x1) +
    (Number.isInteger(result.x1)
        ? ""
        : " ≈ " + numberText(result.x1)) +
    "</div>";

html +=
    "<div dir='ltr' class='step-line'>" +
    "x₂ = " +
    fractionText(result.x2) +
    (Number.isInteger(result.x2)
        ? ""
        : " ≈ " + numberText(result.x2)) +
    "</div>";

        return html;
    }



    /* =========================
       دکمه حل
    ========================= */

    solveButton.addEventListener("click", function () {

        const equation =
            input.value.trim();

        if (!equation) {

            answer.textContent =
                "لطفاً ابتدا یک معادله وارد کن.";

            steps.innerHTML =
                "<p class='empty-message'>" +
                "معادله‌ای وارد نشده است." +
                "</p>";

            checkResult.textContent =
                "هنوز جوابی برای بررسی وجود ندارد.";

            return;
        }


        try {

            const normalized =
                normalizeNumbers(equation);

            const expandedInfo =
                createExpansionInfo(normalized);

            const result =
                solveEquation(normalized);


            if (result.type === "linear") {

                answer.innerHTML =
                    "<strong>x = " +
                    numberText(result.x) +
                    "</strong>";

                steps.innerHTML =
                    createLinearSteps(
                        result,
                        expandedInfo
                    );

             

                return;
            }


            if (result.type === "infinite") {

                answer.innerHTML =
                    "<strong>بی‌نهایت جواب دارد.</strong>";

                steps.innerHTML =
                    "<div class='step-explanation'>" +
                    "دو طرف معادله یکسان هستند، بنابراین هر مقدار x معادله را درست می‌کند." +
                    "</div>";

              

                return;
            }


            if (result.type === "none") {

                answer.innerHTML =
                    "<strong>جواب ندارد.</strong>";

                steps.innerHTML =
                    "<div class='step-explanation'>" +
                    "این معادله جواب ندارد." +
                    "</div>";

                
                return;
            }


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
        "<strong>" +
        "x₁ = " +
        fractionText(result.x1) +
        (Number.isInteger(result.x1)
            ? ""
            : " ≈ " + numberText(result.x1)) +
        " ، " +
        "x₂ = " +
        fractionText(result.x2) +
        (Number.isInteger(result.x2)
            ? ""
            : " ≈ " + numberText(result.x2)) +
        "</strong>";
}

                else {

                    answer.innerHTML =
                        "<strong>جواب حقیقی ندارد.</strong>";
                }


                steps.innerHTML =
                    createQuadraticSteps(result);

                

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

        

        input.focus();
    });


    /* =========================
       روش‌های ورود
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
