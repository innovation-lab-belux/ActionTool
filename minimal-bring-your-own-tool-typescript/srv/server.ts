import cds from "@sap/cds";
import {z} from "zod";
import {zodToJsonSchema} from "zod-to-json-schema";

// prettier-ignore
// @ts-ignore
import cds_swagger from 'cds-swagger-ui-express'

// Enable swagger
cds.on("bootstrap", async (app: any) => {
    app.use(
        cds_swagger({
            basePath: "/swagger-ui",
            diagram: true,
        }),
    );
});


// -----------------
// --- Requests ---
// -----------------
export interface Config {
    name: string;
    value: string;
}

export interface BaseRequest {
    tenantId: string;
    agentId: string;
    chatId: string;
    toolId: string;
}

export interface MetadataRequest extends BaseRequest {
}

export interface CallbackRequest extends BaseRequest {
    toolInput: string;
}

export interface ConfigChangedRequest extends BaseRequest {
    config: Config[];
}

export interface ResourcesChangedRequest extends ConfigChangedRequest {
    addedOrUpdatedResources: string[];
    deletedResources: string[];
}

// -----------------
// --- Responses ---
// -----------------
export interface MetadataResponse {
    name: string;
    description: string;
    schema: string;
}

export interface CallbackResponse {
    response: string;
}

export interface ErrorResponse {
    error?: string;
}

export interface ShoppingListItem {
    itemName: string;
    quantity: number;
}

// -----------------
// --- Handlers ---
// -----------------
// noinspection JSUnusedGlobalSymbols
export class ByoExample extends cds.ApplicationService {
    private readonly log = cds.log('Resources changed');
    private readonly shoppingList = new Map<string, number>()

    private async onMetadata(request: cds.Request): Promise<MetadataResponse> {
        const payload = request.data as MetadataRequest;
        this.log.info('Metadata:', payload);

        const zodSchema = z.object({
            itemName: z.string().describe('Name of the item that should be added to the shopping list'),
            quantity: z.number().default(1).describe('Quantity of the item'),
        })

        return {
            name: "add-to-shopping-list-tool",
            description: "This tool adds items to the current shopping list and returns the whole list",
            schema: JSON.stringify(zodToJsonSchema(zodSchema)),
        };
    }

    private async onCallback(request: cds.Request): Promise<CallbackResponse> {
        const payload = request.data as CallbackRequest;
        this.log.info('Callback:', payload);

        const shoppingListItem = JSON.parse(payload.toolInput) as ShoppingListItem;

        const existingQuantity = this.shoppingList.get(shoppingListItem.itemName.toLowerCase()) ?? 0
        this.shoppingList.set(shoppingListItem.itemName.toLowerCase(), existingQuantity + shoppingListItem.quantity)

        return {
            response: `The shopping list now contains:\n${[...this.shoppingList.entries()].map(([itemName, quantity]) => `- ${itemName}: ${quantity}`).join("\n")}`,
        };
    }

    private async onConfigChanged(
        request: cds.Request
    ): Promise<ErrorResponse> {
        const payload = request.data as ConfigChangedRequest;
        this.log.info('Config changed:', payload);

        // We ignore it
        return {  };
    }

    private async onResourcesChanged(
        request: cds.Request
    ): Promise<ErrorResponse> {
        const payload = request.data as ResourcesChangedRequest;
        this.log.info('Resources changed:', payload);

        // We return an error as we don't allow resources
        request.error(400, "Example resource error");
        return {}
    }

    async init(): Promise<void> {
        this.on("metadata", async (req: cds.Request) => {
            return this.onMetadata(req);
        });

        this.on("callback", async (req: cds.Request) => {
            return this.onCallback(req);
        });

        this.on("configChanged", async (req: cds.Request) => {
            return this.onConfigChanged(req);
        });

        this.on("resourcesChanged", async (req: cds.Request) => {
            return this.onResourcesChanged(req);
        });

        await super.init();
    }
}
