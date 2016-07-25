export default function (meta) {
    function swegger(req, res, next) { return next(); }

    swegger.meta = meta;

    return swegger;
}
