import Fastify from "fastify";
const server = Fastify();

server.get("/", async (request, reply) => {
	return { pong: "hello world" };
});

server.listen({ port: 3000, host: "0.0.0.0" }, (err, address) => {
	if (err) throw err;
	console.log('Sever running: ${address}');
});
