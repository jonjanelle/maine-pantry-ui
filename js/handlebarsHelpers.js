Handlebars.registerHelper('arr_empty', function(arr, opts) {
    if (arr === null || arr === undefined || arr.length === 0) {
        return opts.fn(this);
    } else {
        return opts.inverse(this);
    }
});