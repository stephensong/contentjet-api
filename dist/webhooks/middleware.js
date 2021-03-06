"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const lodash_1 = require("lodash");
const actionToEventMap = {
    'update': 'Updated',
    'create': 'Created',
    'delete': 'Deleted',
    'bulkDelete': 'DeletedBulk'
};
const actions = Object.keys(actionToEventMap);
async function default_1(ctx, next) {
    // Immediately pass control to the next middleware. We invoke web hooks
    // asynchronously after all other middleware.
    await next();
    const { project, viewsetResult } = ctx.state;
    if (!viewsetResult || !project)
        return;
    const { modelClass, action, data } = viewsetResult;
    if (!actions.includes(action))
        return;
    const webHooks = await project.getActiveWebHooks();
    for (const webHook of webHooks) {
        const event = `${modelClass.tableName}${actionToEventMap[action]}`;
        if (!lodash_1.get(webHook, event))
            continue;
        // For bulkDelete action data is an array of the deleted record ids
        const payload = {
            dateTime: new Date(),
            action: action,
            model: modelClass.tableName,
            project: lodash_1.pick(project, ['id', 'name']),
            webHook: lodash_1.pick(webHook, ['id', 'name', 'url']),
            target: actionToEventMap[action] === 'DeletedBulk' ? data : [lodash_1.pick(data, 'id')]
        };
        try {
            await axios_1.default.post(webHook.url, payload);
        }
        catch (err) {
            // TODO: Log error
        }
    }
    ;
}
exports.default = default_1;
;
