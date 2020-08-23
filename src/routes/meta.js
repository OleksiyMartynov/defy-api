import { Router } from "express";
import urlMetadata from "url-metadata";
const router = Router();

router.get("/", async (req, res) => {
  urlMetadata(req.query.url, { timeout: 4000 }).then(
    function (metadata) {
      res.send({ metadata });
    },
    function (error) {
      res.status(500).send({ error: "Failed to get metadata", reason: error });
    }
  );
});
export default router;
