import json
import os
from typing import List
from fastapi import FastAPI
from pydantic import BaseModel, Field
from pydantic_core import from_json
import uvicorn
from starlette.responses import JSONResponse

app = FastAPI()
shopping_list: dict[str, int] = {}


class BaseRequest(BaseModel):
    tenantId: str
    agentId: str
    chatId: str
    toolId: str


class MetadataRequest(BaseRequest):
    pass


class CallbackRequest(BaseRequest):
    toolInput: str  # Json string of what the defined agent tool schema


class Config(BaseModel):
    name: str
    value: str


class ConfigChangedRequest(BaseRequest):
    config: List[Config]


class ResourceChangedRequest(ConfigChangedRequest):
    addedOrUpdatedResources: List[str]
    deletedResources: List[str]


class ShoppingListToolInput(BaseModel):
    itemName: str = Field(..., description='Name of the item that should be added to the shopping list')
    quantity: int = Field(1, description='Quantity of the item')


class ErrorDetails(BaseModel):
    message: str


class CustomErrorResponse(BaseModel):
    error: ErrorDetails




@app.get("/")
async def health():
    return {
        'status': 'ok',
    }


@app.post("/metadata")
async def on_metadata_fetched(req: MetadataRequest):
    print("Metadata fetched", json.dumps(req.dict()))

    return {
        'name': 'add-to-shopping-list-tool',
        'description': 'This tool adds items to the current shopping list and returns the whole list',
        'schema': json.dumps(ShoppingListToolInput.model_json_schema())
    }


@app.post("/callback")
async def on_tool_called(req: CallbackRequest):
    print("Callback called", json.dumps(req.dict()))

    input_obj = from_json(req.toolInput, allow_partial=True)
    item_name = input_obj['itemName'].lower()
    quantity = input_obj['quantity']

    print('Adding', item_name, quantity)

    if shopping_list.get(item_name) is not None:
        shopping_list[item_name] = shopping_list[item_name] + quantity
    else:
        shopping_list[item_name] = quantity

    return {
        'response': 'The shopping list now contains: ' + "\n".join(
            [f"- {itemName}: {quantity}" for itemName, quantity in shopping_list.items()])
    }


@app.post("/resourcesChanged")
async def on_resource_changed(req: ResourceChangedRequest):
    print("Resource changed, but we don't allow it", json.dumps(req.dict()))

    err = CustomErrorResponse(error=ErrorDetails(message="Example resource error"))
    return JSONResponse(status_code=400, content=err.dict())


@app.post("/configChanged")
async def on_config_changed(req: ConfigChangedRequest):
    print("Config changed, we ignore it", json.dumps(req.dict()))

    return {}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", log_level="info", port=int(os.environ.get('PORT', 8080)))
