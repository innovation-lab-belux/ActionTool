@path                              : '/api/v1'
@Core.SchemaVersion                : '1.0.0'
@Capabilities.BatchSupported       : false
@Capabilities.KeyAsSegmentSupported: false
@Common.Label                      : 'BYO Example'
@Core.Description                  : 'BYO Example'
@Core.LongDescription              : 'BYO Example'
service ByoExample {

  type Config {
    name : String;
    value : String;
  }

  action metadata(
                  @mandatory
                  tenantId : String not null,
                  @mandatory
                  agentId : String not null,
                  @mandatory
                  chatId : String not null,
                  @mandatory
                  toolId : String not null) returns {
    name : String;
    description : String;
    schema : String;
  };

  action callback(
                  @mandatory
                  toolInput : String not null,
                  @mandatory
                  tenantId : String not null,
                  @mandatory
                  agentId : String not null,
                  @mandatory
                  chatId : String not null,
                  @mandatory
                  toolId : String not null) returns {
    response : String;
  };

  action configChanged(
                  @mandatory
                  tenantId : String not null,
                  @mandatory
                  agentId : String not null,
                  @mandatory
                  chatId : String not null,
                  @mandatory
                  toolId : String not null,
                  @mandatory
                  config : many Config) returns {
    error : String null;
  };

  action resourcesChanged(
                  @mandatory
                  tenantId : String not null,
                  @mandatory
                  agentId : String not null,
                  @mandatory
                  chatId : String not null,
                  @mandatory
                  toolId : String not null,
                  @mandatory
                  config : many Config not null,
                  @mandatory
                  addedOrUpdatedResources : many String,
                  @mandatory
                  deletedResources : many String) returns {
    error : String null;
  };
}
