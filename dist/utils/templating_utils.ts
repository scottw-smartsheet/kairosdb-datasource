import _ from "lodash";

export class TemplatingUtils {
    public static MULTI_VALUE_SEPARATOR: string = ",";
    private static MULTI_VALUE_REGEX: RegExp = /{.*?}/g;
    private static MULTI_VALUE_BOUNDARIES: RegExp = /[{}]/g;
    private templateSrv: any;
    private scopedVars: any;

    constructor(templateSrv: any, scopedVars: any) {
        this.templateSrv = templateSrv;
        this.scopedVars = scopedVars;
    }

    public replace(expression: string): string[] {
        const replacedExpression = this.templateSrv.replace(expression, this.scopedVars);
        /* This is a semi-broken form of multi-value substitution.
         * If the multi-value block contained in the MULTI_VALUE_REGEX does
         * not contain a MULTI_VALUE_SEPARATOR, then it is assumed that the
         * particular multi-value block is NOT actually a multi-value block
         * and is instead passed through un-modified in the expression.
         *
         * That is does because we have production metric names that contain
         * braces. :(
         * If Grafana only uses the multi-value format when a variable
         * actually contains multiple values, then this will just work.
         * However, if Grafana uses the multi-value format for any variiable
         * that has been marked as supporting multiple values, regardless
         * of the number of values selected for it, then this is likely to
         * break.  It could potentially be updated to perform the
         * substitution if the value name is found in `this.scopedVars`.
         *     -- Scott Wimer 2019-03-15
         */

        if (replacedExpression) {
            const matchedMultiValues = replacedExpression.match(TemplatingUtils.MULTI_VALUE_REGEX);

            if (!_.isNil(matchedMultiValues)) {
                let replacedValues = [replacedExpression];
                matchedMultiValues.forEach((multiValue) => {
                    if (multiValue.indexOf(MULTI_VALUE_SEPARATOR) == -1) {
                        // Not multiple values, skip any substitution.
                        return
                    }
                    const values = multiValue.replace(TemplatingUtils.MULTI_VALUE_BOUNDARIES, "")
                        .split(TemplatingUtils.MULTI_VALUE_SEPARATOR);
                    replacedValues = _.flatMap(values, (value) => {
                        return replacedValues.map((replacedValue) => {
                            return replacedValue.replace(multiValue, value);
                        });
                    });
                });
                return replacedValues;
            }
        }
        return [replacedExpression];
    }

    public replaceAll(expressions: string[]): string[] {
        return _.flatten(expressions.map((expression) => this.replace(expression)));
    }
}
