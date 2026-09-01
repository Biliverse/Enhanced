import { fetch } from "@nsnanocat/util";
import { Hono } from "hono/tiny";
import HonoWorkerAdapter from "./class/HonoWorkerAdapter.mjs";
import { Response } from "./process/Response.mjs";
/***************** 处理 *****************/
/***************** Processing *****************/
export default new Hono()
	.get("/", c => c.text("OK"))
	.all("/:rest{.*}", async c => {
		let $request = await HonoWorkerAdapter.buildRequest(c.req);
		$request = HonoWorkerAdapter.buildArgument($request);
		let $response = await fetch($request);
		$response = await Response($request, $response);
		return HonoWorkerAdapter.writeResponse(c, $response);
	})
	.onError((error, c) => {
		console.error(error);
		return c.body(error.message, 500);
	});
