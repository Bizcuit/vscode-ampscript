import * as JSEP from "jsep";

export class SoapUtils {
	static getProp(obj: any, path: string, shouldReturnArray = false): any {
		let result: any = obj;

		const chunks: Array<string> = path.split('.');

		for (const c of chunks) {
			if (result?.[c] !== undefined) {
				result = result?.[c];
			}
			else {
				result = result?.[0]?.[c];
			}
		}

		if (Array.isArray(result) && result.length > 0 && !shouldReturnArray) {
			result = result?.[0];
		}


		return result;
	}

	static getStrProp(obj: any, path: string): string {
		return SoapUtils.getProp(obj, path, false) || "";
	}

	static getArrProp(obj: any, path: string): Array<any> {
		return SoapUtils.getProp(obj, path, true) || [];
	}

	static createRetrieveBody(objectType: string, properties: Array<string>, filter?: any): any {
		const result: any = {
			RetrieveRequestMsg: {
				$: { "xmlns": "http://exacttarget.com/wsdl/partnerAPI" },
				RetrieveRequest: {
					ObjectType: objectType,
					Properties: properties
				}
			}
		};

		if (filter !== undefined) {
			result.RetrieveRequestMsg.RetrieveRequest["Filter"] = SoapUtils.prepareSoapFilter(filter);
		}

		return result;
	}

	static createUpdateBody(objectType: string, objects: Array<any>): any {
		const result: any = {
			UpdateRequest: {
				$: { "xmlns": "http://exacttarget.com/wsdl/partnerAPI" },
				Options: {
					SaveOptions: {
						SaveOption: {
							PropertyName: "*",
							SaveAction: "UpdateAdd"
						}
					}
				},
				Objects: []
			}
		};

		objects.forEach((o: any) => {
			o.$ = { "xsi:type": objectType };
			result.UpdateRequest.Objects.push(o);
		});

		return result;
	}

	static prepareSoapFilter(filter: any): any {
		// Simple filter
		if (filter?.SimpleOperator !== undefined) {
			filter["$"] = { "xsi:type": "SimpleFilterPart" };
			return filter;
		}

		// Complex filter
		if (filter?.LogicalOperator !== undefined) {
			filter["$"] = { "xsi:type": "ComplexFilterPart" };
			filter["LeftOperand"] = SoapUtils.prepareSoapFilter(filter["LeftOperand"]);
			filter["RightOperand"] = SoapUtils.prepareSoapFilter(filter["RightOperand"]);
			return filter;
		}

		return undefined;
	}
}

export class SoapFilterExpression {
	expression: JSEP.Expression;

	constructor(expressionString: string) {
		JSEP.addBinaryOp("and", 2);
		JSEP.addBinaryOp("AND", 2);
		JSEP.addBinaryOp("or", 1);
		JSEP.addBinaryOp("OR", 1);
		JSEP.addBinaryOp("=", 6);
		JSEP.addBinaryOp("<>", 6);
		JSEP.addBinaryOp("like", 6);
		JSEP.addBinaryOp("LIKE", 6);

		this.expression = JSEP(expressionString);
	}

	get filter(): any {
		return this.getFilter(this.expression);
	}

	getFilter(expression: any): any {
		if (expression?.operator === undefined) {
			return undefined;
		}

		if (this.getSimpleOperator(expression.operator) !== undefined) {
			return {
				Property: this.getFilterSide(expression.left),
				SimpleOperator: this.getSimpleOperator(expression.operator),
				Value: this.getFilterSide(expression.right)
			};
		}

		return {
			LeftOperand: this.getFilter(expression.left),
			RightOperand: this.getFilter(expression.right),
			LogicalOperator: this.getLogicalOperator(expression.operator)
		};
	}


	getFilterSide(side: any): any {
		switch (side.type) {
			case "Literal":
				return side.value;
			case "Identifier":
				return side.name;
			case "ArrayExpression":
				let name = "";
				side.elements.forEach((e: any) => { name += e.name + " "; });
				return name.trim();
		}

		return side.value || "";
	}

	getLogicalOperator(operator: string): string {
		switch (operator.toLowerCase()) {
			case "&&":
			case "and":
				return "AND";
			case "or":
			case "||":
				return "OR";
		}

		return operator.toUpperCase();
	}

	getSimpleOperator(operator: string): string | undefined {
		switch (operator.toLowerCase()) {
			case "==":
			case "=":
				return "equals";
			case "!=":
			case "<>":
				return "notEquals";
			case ">":
				return "greaterThan";
			case "<":
				return "lessThan";
			case "like":
				return "like";
		}

		return undefined;
	}
}