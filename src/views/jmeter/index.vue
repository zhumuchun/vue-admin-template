<template>
  <div @click="handleToJmx">
    <div>
      <el-upload
        class="upload-demo"
        action=""
        :on-change="handleFileUpload"
        :auto-upload="false"
      >
        <el-button size="small" type="primary">点击上传</el-button>
      </el-upload>
    </div>
    <div class="components-container">
      <split-pane split="vertical" :default-percent="30">
        <template slot="paneL">
          <div class="left-container">
            <el-input
              v-model="filterText"
              placeholder="keyword"
              class="filter-input"
            />
            <div style="overflow: scroll;margin-bottom: 10px;height: 100%">
              <el-tree
                ref="veTree"
                node-key="id"
                height="100%"
                highlight-current
                :draggable="true"
                :expand-on-click-node="false"
                :filter-node-method="filterTreeNode"
                :data="treeData"
                :props="props"
                style="margin-left: 10px"
                @node-click="handleTreeNodeClick"
                @node-contextmenu="handleTreeNodeRightClick"
                @node-expand="contextMenuVisible=false"
                @node-collapse="contextMenuVisible=false"
              >
                <span slot-scope="{ node, data }">
                  <span :style="{opacity: data.attributes.enabled === 'false'?0.5:1}">
                    <i :class="elementIcons[data.attributes.testclass]" style="margin-right: 5px"></i>
                    <span>{{ node.label }}</span>
                  </span>
                </span>
              </el-tree>
            </div>
          </div>
          <el-popover
            v-model:visible="contextMenuVisible"
            trigger="manual"
          >
            <el-cascader-panel
              v-if="contextMenuVisible"
              ref="contextMenu"
              :options="contextMenuOptions"
              :props="{ expandTrigger: 'hover', value: 'label'}"
              style="border: 0"
              @change="handleContextMenuClick"
            />
          </el-popover>
        </template>
        <template slot="paneR">
          <div class="right-container">
            <div v-if="checkedData.attributes.testname!==undefined">
              <el-card :header="checkedData.attributes.testclass" shadow="never">
                <el-form ref="form" :model="checkedData" label-width="120px" label-position='left' size="small">
                  <el-form-item label="名称">
                    <el-input v-model="checkedData.attributes.testname"/>
                  </el-form-item>
                  <el-form-item label="注释">
                    <el-input v-model="checkedData['TestPlan.comments']"/>
                  </el-form-item>
                  <div v-if="checkedData.attributes.guiclass==='TestPlanGui'">
                    <div style="text-align: center; margin-bottom: 10px">用户定义的变量</div>
                    <el-card shadow="never">
                      <el-table
                        :data="checkedData['TestPlan.user_defined_variables']['Arguments.arguments']"
                        size="mini"
                        style="width: 100%"
                        @selection-change="handleArgumentsSelectionChange"
                        class="arguments-table"
                      >
                        <el-table-column
                          type="selection"
                          width="55">
                        </el-table-column>
                        <el-table-column
                          prop="name"
                          label="名称"
                        >
                          <template slot-scope="scope">
                            <el-input
                              v-model="scope.row['Argument.name']"
                              placeholder="请输入内容"
                              @change="val=>{scope.row.attributes.name=val}"
                            />
                          </template>
                        </el-table-column>
                        <el-table-column
                          prop="value"
                          label="值"
                        >
                          <template slot-scope="scope">
                            <el-input
                              v-model="scope.row['Argument.value']"
                              placeholder="请输入内容"
                            />
                          </template>
                        </el-table-column>
                      </el-table>
                      <div style="margin-top: 20px; text-align: center">
                        <el-button
                          type="primary"
                          @click="handleArgumentsAdd(checkedData['TestPlan.user_defined_variables']['Arguments.arguments'], 'Argument')"
                          size="mini"
                        >
                          添加
                        </el-button>
                        <el-button
                          :disabled="argumentsSelection.length===0"
                          type="primary"
                          @click="handleArgumentsDelete(checkedData['TestPlan.user_defined_variables']['Arguments.arguments'], 'Argument')"
                          size="mini"
                        >
                          删除
                        </el-button>
                      </div>
                    </el-card>
                  </div>
                  <div v-if="checkedData.attributes.guiclass==='ThreadGroupGui'">
                    <label-border title="在取样器错误后要执行的动作" :bottom-padding="0">
                      <el-form-item label-width="0px">
                        <el-radio-group v-model="checkedData['ThreadGroup.on_sample_error']">
                          <el-radio
                            v-for="choice in [
                              {label:'继续', value:'continue'},
                              {label:'启动下一进程循环',value:'startnextloop'},
                              {label:'停止线程', value:'stopthread'},
                              {label:'停止测试', value: 'stoptest'},
                              {label: '立即停止测试',value: 'stoptestnow'}
                            ]"
                            :label="choice.value"
                            :key="choice.value">
                            {{ choice.label }}
                          </el-radio>
                        </el-radio-group>
                      </el-form-item>
                    </label-border>
                    <label-border title="线程属性">
                      <el-form-item label="线程数">
                        <el-input-number v-model="checkedData['ThreadGroup.num_threads']" controls-position="right"/>
                      </el-form-item>
                      <el-form-item label="Ramp-Up时间(秒)">
                        <el-input-number v-model="checkedData['ThreadGroup.ramp_time']" controls-position="right"/>
                      </el-form-item>
                      <div style="display:flex">
                        <el-form-item label="循环次数" label-width="58px">
                          <el-checkbox
                            v-model="checkedData['ThreadGroup.main_controller']['LoopController.continue_forever']"
                          >永远
                          </el-checkbox>
                        </el-form-item>
                        <el-form-item label-width="10px">
                          <el-input-number
                            v-model="checkedData['ThreadGroup.main_controller']['LoopController.loops']"
                            controls-position="right"
                          />
                        </el-form-item>
                      </div>
                      <el-form-item>
                        <el-checkbox
                          v-model="checkedData['ThreadGroup.same_user_on_next_iteration']"
                        >Same user on each iteration
                        </el-checkbox>
                      </el-form-item>
                      <el-form-item>
                        <el-checkbox
                          v-model="checkedData['ThreadGroup.delayedStart']"
                        >延迟创建现程直到需要
                        </el-checkbox>
                      </el-form-item>
                      <el-form-item>
                        <el-checkbox
                          v-model="checkedData['ThreadGroup.scheduler']"
                        >调度器
                        </el-checkbox>
                      </el-form-item>
                      <el-form-item label="持续时间(秒)">
                        <el-input-number
                          :disabled="!checkedData['ThreadGroup.scheduler']"
                          v-model="checkedData['ThreadGroup.ramp_time']"
                          controls-position="right"/>
                      </el-form-item>
                      <el-form-item label="启动延迟(秒)">
                        <el-input-number
                          :disabled="!checkedData['ThreadGroup.scheduler']"
                          v-model="checkedData['ThreadGroup.ramp_time']"
                          controls-position="right"/>
                      </el-form-item>
                    </label-border>
                  </div>
                  <div v-if="['HttpTestSampleGui','HttpDefaultsGui'].includes(checkedData.attributes.guiclass)">
                    <el-tabs type="border-card" style="border: 0">
                      <el-tab-pane label="基本">
                        <label-border title="Web服务器" :bottom-padding="0">
                          <el-row :gutter="20">
                            <el-col :span="4">
                              <el-form-item label="协议" label-width="40px">
                                <el-select v-model="checkedData['HTTPSampler.protocol']">
                                  <el-option
                                    v-for="item in ['http', 'https']"
                                    :key="item"
                                    :label="item"
                                    :value="item">
                                  </el-option>
                                </el-select>
                              </el-form-item>
                            </el-col>
                            <el-col :span="16">
                              <el-form-item label="服务器名称或ip">
                                <el-input v-model="checkedData['HTTPSampler.domain']"/>
                              </el-form-item>
                            </el-col>
                            <el-col :span="4">
                              <el-form-item label="端口号" label-width="50px">
                                <el-input v-model="checkedData['HTTPSampler.port']"/>
                              </el-form-item>
                            </el-col>
                          </el-row>
                        </label-border>
                        <label-border title="HTTP请求">
                          <el-row :gutter="20">
                            <el-col :span="4">
                              <el-form-item label-width="0px">
                                <el-select v-model="checkedData['HTTPSampler.method']">
                                  <el-option
                                    v-for="item in ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']"
                                    :key="item"
                                    :label="item"
                                    :value="item">
                                  </el-option>
                                </el-select>
                              </el-form-item>
                            </el-col>
                            <el-col :span="16">
                              <el-form-item label="路径" label-width="40px">
                                <el-input v-model="checkedData['HTTPSampler.path']"/>
                              </el-form-item>
                            </el-col>
                            <el-col :span="4">
                              <el-form-item label="内容编码" label-width="60px">
                                <el-input v-model="checkedData['HTTPSampler.contentEncoding']"/>
                              </el-form-item>
                            </el-col>
                          </el-row>
                          <el-checkbox v-model="checkedData['HTTPSampler.auto_redirects']">自动重定向</el-checkbox>
                          <el-checkbox v-model="checkedData['HTTPSampler.follow_redirects']">跟随重定向</el-checkbox>
                          <el-checkbox v-model="checkedData['HTTPSampler.use_keepalive']">使用KeepAlive</el-checkbox>
                          <el-checkbox
                            v-model="checkedData['HTTPSampler.DO_MULTIPART_POST']"
                          >
                            对POST使用multipart/form-data
                          </el-checkbox>
                          <el-checkbox v-model="checkedData['HTTPSampler.BROWSER_COMPATIBLE_MULTIPART']">
                            与浏览器兼容的头
                          </el-checkbox>
                          <el-tabs
                            :value="activeName"
                            @tab-click="handleTabClick"
                            type="border-card"
                            style="border: 0; margin-top: 20px"
                          >
                            <el-tab-pane
                              label="参数"
                              name="args"
                              :disabled="checkedData['HTTPsampler.Arguments']['Arguments.arguments'].length===1 &&
                                ['', undefined].includes(checkedData['HTTPsampler.Arguments']['Arguments.arguments'][0]['Argument.name']) &&
                                checkedData['HTTPsampler.Arguments']['Arguments.arguments'][0]['Argument.value']!==''"
                            >
                              <el-card shadow="never">
                                <el-table
                                  :data="checkedData['HTTPsampler.Arguments']['Arguments.arguments']"
                                  size="mini"
                                  style="width: 100%"
                                  @selection-change="handleArgumentsSelectionChange"
                                  class="arguments-table"
                                >
                                  <el-table-column
                                    type="selection"
                                    width="55">
                                  </el-table-column>
                                  <el-table-column
                                    prop="name"
                                    label="名称"
                                  >
                                    <template slot-scope="scope">
                                      <el-input
                                        v-model="scope.row['Argument.name']"
                                        placeholder="请输入内容"
                                        @change="val=>{scope.row.attributes.name=val}"
                                      />
                                    </template>
                                  </el-table-column>
                                  <el-table-column
                                    prop="value"
                                    label="值"
                                  >
                                    <template slot-scope="scope">
                                      <el-input
                                        v-model="scope.row['Argument.value']"
                                        placeholder="请输入内容"
                                      />
                                    </template>
                                  </el-table-column>
                                  <el-table-column
                                    prop="always_encode"
                                    label="编码？"
                                    width="80"
                                  >
                                    <template slot-scope="scope">
                                      <el-checkbox v-model="scope.row['HTTPArgument.always_encode']"/>
                                    </template>
                                  </el-table-column>
                                  <el-table-column
                                    prop="content_type"
                                    label="内容类型"
                                  >
                                    <template slot-scope="scope">
                                      <el-input v-model="scope.row['HTTPArgument.content_type']"/>
                                    </template>
                                  </el-table-column>
                                  <el-table-column
                                    prop="use_equals"
                                    label="包含等于？"
                                    width="100"
                                  >
                                    <template slot-scope="scope">
                                      <el-checkbox v-model="scope.row['HTTPArgument.use_equals']"/>
                                    </template>
                                  </el-table-column>
                                </el-table>
                                <div style="margin: 20px; text-align: center">
                                  <el-button
                                    type="primary"
                                    @click="handleArgumentsAdd(checkedData['HTTPsampler.Arguments']['Arguments.arguments'], 'HTTPArgument')"
                                    size="mini"
                                  >
                                    添加
                                  </el-button>
                                  <el-button
                                    :disabled="argumentsSelection.length===0"
                                    type="primary"
                                    @click="handleArgumentsDelete(checkedData['HTTPsampler.Arguments']['Arguments.arguments'], 'HTTPArgument')"
                                    size="mini"
                                  >
                                    删除
                                  </el-button>
                                </div>
                              </el-card>
                            </el-tab-pane>
                            <el-tab-pane
                              label="消息体数据"
                              name="body"
                              :disabled="checkedData['HTTPsampler.Arguments']['Arguments.arguments'].length > 1 ||
                                (checkedData['HTTPsampler.Arguments']['Arguments.arguments'].length===1 &&
                                !['', undefined].includes(checkedData['HTTPsampler.Arguments']['Arguments.arguments'][0]['Argument.name']))"
                            >
                              <div v-if="checkedData['HTTPsampler.Arguments']['Arguments.arguments'].length===1">
                                <el-input
                                  type="textarea"
                                  :autosize="{ minRows: 2, maxRows: 80}"
                                  v-model="checkedData['HTTPsampler.Arguments']['Arguments.arguments'][0]['Argument.value']">
                                </el-input>
                              </div>
                            </el-tab-pane>
                            <el-tab-pane label="文件上传" name="file">
                              <el-card shadow="never">
                                <div v-if="checkedData['HTTPsampler.Files'] !== undefined">
                                  <el-table
                                    :data="checkedData['HTTPsampler.Files']['HTTPFileArgs.files']"
                                    size="mini"
                                    style="width: 100%"
                                    @selection-change="handleArgumentsSelectionChange"
                                    class="arguments-table"
                                  >
                                    <el-table-column
                                      type="selection"
                                      width="55">
                                    </el-table-column>
                                    <el-table-column
                                      prop="path"
                                      label="文件名称"
                                    >
                                      <template slot-scope="scope">
                                        <el-input
                                          v-model="scope.row['File.path']"
                                          placeholder="请输入内容"
                                          @change="val=>{scope.row.attributes.name=val}"
                                        />
                                      </template>
                                    </el-table-column>
                                    <el-table-column
                                      prop="paramname"
                                      label="参数名称"
                                    >
                                      <template slot-scope="scope">
                                        <el-input
                                          v-model="scope.row['File.paramname']"
                                          placeholder="请输入内容"
                                        />
                                      </template>
                                    </el-table-column>
                                    <el-table-column
                                      prop="mimetype"
                                      label="内容类型"
                                    >
                                      <template slot-scope="scope">
                                        <el-input v-model="scope.row['File.mimetype']"/>
                                      </template>
                                    </el-table-column>
                                  </el-table>
                                </div>
                                <div style="margin: 20px; text-align: center">
                                  <el-button
                                    type="primary"
                                    @click="handleArgumentsAdd(checkedData['HTTPsampler.Files']['HTTPFileArgs.files'], 'HTTPFileArg')"
                                    size="mini"
                                  >
                                    添加
                                  </el-button>
                                  <el-button
                                    :disabled="argumentsSelection.length===0"
                                    type="primary"
                                    @click="handleArgumentsDelete(checkedData['HTTPsampler.Files']['HTTPFileArgs.files'], 'HTTPFileArg')"
                                    size="mini"
                                  >
                                    删除
                                  </el-button>
                                </div>
                              </el-card>
                            </el-tab-pane>
                          </el-tabs>
                        </label-border>
                      </el-tab-pane>
                      <el-tab-pane label="高级">配置管理</el-tab-pane>
                    </el-tabs>
                  </div>
                  <div v-if="checkedData.attributes.guiclass==='HeaderPanel'">
                    <label-border title="信息头存储在信息头管理器中">
                      <el-table
                        :data="checkedData['HeaderManager.headers']"
                        size="mini"
                        style="width: 100%"
                        @selection-change="handleArgumentsSelectionChange"
                        class="arguments-table"
                      >
                        <el-table-column
                          type="selection"
                          width="55">
                        </el-table-column>
                        <el-table-column
                          prop="name"
                          label="名称"
                        >
                          <template slot-scope="scope">
                            <el-input
                              v-model="scope.row['Header.name']"
                              placeholder="请输入内容"
                              @change="val=>{scope.row.attributes.name=val}"
                            />
                          </template>
                        </el-table-column>
                        <el-table-column
                          prop="value"
                          label="值"
                        >
                          <template slot-scope="scope">
                            <el-input v-model="scope.row['Header.value']" placeholder="请输入内容"></el-input>
                          </template>
                        </el-table-column>
                      </el-table>
                      <div style="margin: 20px; text-align: center">
                        <el-button
                          type="primary"
                          @click="handleArgumentsAdd(checkedData['HeaderManager.headers'],'Header')"
                          size="mini"
                        >
                          添加
                        </el-button>
                        <el-button
                          :disabled="argumentsSelection.length===0"
                          type="primary"
                          @click="handleArgumentsDelete(checkedData['HeaderManager.headers'], 'Header')"
                          size="mini"
                        >
                          删除
                        </el-button>
                      </div>
                    </label-border>
                  </div>
                  <div v-if="checkedData.attributes.guiclass==='ArgumentsPanel'">
                    <div style="text-align: center; margin-bottom: 10px">用户定义的变量</div>
                    <el-card shadow="never">
                      <el-table
                        :data="checkedData['Arguments.arguments']"
                        size="mini"
                        style="width: 100%"
                        @selection-change="handleArgumentsSelectionChange"
                        class="arguments-table"
                      >
                        <el-table-column
                          type="selection"
                          width="55">
                        </el-table-column>
                        <el-table-column
                          prop="name"
                          label="名称"
                        >
                          <template slot-scope="scope">
                            <el-input
                              v-model="scope.row['Argument.name']"
                              placeholder="请输入内容"
                              @change="val=>{scope.row.attributes.name=val}"
                            />
                          </template>
                        </el-table-column>
                        <el-table-column
                          prop="value"
                          label="值"
                        >
                          <template slot-scope="scope">
                            <el-input v-model="scope.row['Argument.value']"
                                      placeholder="请输入内容"></el-input>
                          </template>
                        </el-table-column>
                        <el-table-column
                          prop="value"
                          label="描述"
                        >
                          <template slot-scope="scope">
                            <el-input v-model="scope.row['Argument.desc']" placeholder="请输入内容"></el-input>
                          </template>
                        </el-table-column>
                      </el-table>
                      <div style="margin-top: 20px; text-align: center">
                        <el-button
                          type="primary"
                          size="mini"
                          @click="handleArgumentsAdd(checkedData['Arguments.arguments'], 'Argument')"
                        >
                          添加
                        </el-button>
                        <el-button
                          :disabled="argumentsSelection.length===0"
                          type="primary"
                          @click="handleArgumentsDelete(checkedData['Arguments.arguments'], 'Argument')"
                          size="mini"
                        >
                          删除
                        </el-button>
                      </div>
                    </el-card>
                  </div>
                  <div v-if="checkedData.attributes.guiclass==='JSONPostProcessorGui'">
                    <label-border title="应用于" :bottom-padding="0">
                      <div style="display: flex">
                        <el-form-item label-width="0px">
                          <el-radio-group v-model="checkedData['Sample.scope']">
                            <el-radio
                              v-for="choice in [
                                {label:'Main samples and Sub-samples',value:'all'},
                                {label:'Main samples only',value: undefined},
                                {label:'Sub-samples only',value:'children' },
                                {label:'JMeter variables Name to use',value:'variable'}
                              ]"
                              :label="choice.value"
                              :key="choice.value">
                              {{ choice.label }}
                            </el-radio>
                          </el-radio-group>
                        </el-form-item>
                        <el-form-item label-width="10px" width="100%">
                          <el-input v-model="checkedData['Scope.variable']"
                                    :disabled="checkedData['Sample.scope'] !== 'variable'"/>
                        </el-form-item>
                      </div>
                    </label-border>
                    <el-form-item label="Name of created variables" label-width="280px">
                      <el-input v-model="checkedData['JSONPostProcessor.referenceNames']"/>
                    </el-form-item>
                    <el-form-item label="JSON Path expressions" label-width="280px">
                      <el-input v-model="checkedData['JSONPostProcessor.jsonPathExprs']"/>
                    </el-form-item>
                    <el-form-item label="Match No. (0 for Random)" label-width="280px">
                      <el-input v-model="checkedData['JSONPostProcessor.match_numbers']"/>
                    </el-form-item>
                    <el-form-item label="Compute concatenation var (Sumx _ALL)" label-width="280px">
                      <el-checkbox v-model="checkedData['JSONPostProcessor.compute_concat']"/>
                    </el-form-item>
                    <el-form-item label="Default Values" label-width="280px">
                      <el-input v-model="checkedData['JSONPostProcessor.defaultValues']"/>
                    </el-form-item>
                  </div>
                  <div v-if="checkedData.attributes.testclass==='JSR223PreProcessor'">
                    <el-form-item label="语言">
                      <el-select v-model="checkedData.scriptLanguage">
                        <el-option
                          v-for="item in ['beanshell', 'bsh', 'groovy', 'java', 'jexl', 'jexl2']"
                          :key="item"
                          :label="item"
                          :value="item">
                        </el-option>
                      </el-select>
                    </el-form-item>
                    <el-form-item label="参数">
                      <el-input v-model="checkedData.parameters"/>
                    </el-form-item>
                    <el-form-item label="文件名">
                      <el-input v-model="checkedData.filename"/>
                    </el-form-item>
                    <el-form-item label="如果可用，缓存编译脚本" label-width="180px">
                      <el-checkbox v-model="checkedData.cacheKey" true-label="true" false-label="false"/>
                    </el-form-item>
                    <label-border
                      title="脚本"
                    >
                      <el-input
                        type="textarea"
                        :autosize="{ minRows: 2, maxRows: 80}"
                        v-model="checkedData.script"
                        style="margin-right: 20px"
                      />
                    </label-border>
                  </div>
                  <div v-if="checkedData.attributes.testclass==='DebugSampler'">
                    <el-form-item label="Jmeter属性">
                      <el-select v-model="checkedData.displayJMeterProperties">
                        <el-option
                          v-for="item in [true, false]"
                          :key="item"
                          :label="item"
                          :value="item">
                        </el-option>
                      </el-select>
                    </el-form-item>
                    <el-form-item label="Jmeter变量">
                      <el-select v-model="checkedData.displayJMeterVariables">
                        <el-option
                          v-for="item in [true, false]"
                          :key="item"
                          :label="item"
                          :value="item">
                        </el-option>
                      </el-select>
                    </el-form-item>
                    <el-form-item label="系统属性">
                      <el-select v-model="checkedData.displaySystemProperties">
                        <el-option
                          v-for="item in [true, false]"
                          :key="item"
                          :label="item"
                          :value="item">
                        </el-option>
                      </el-select>
                    </el-form-item>
                  </div>
                </el-form>
              </el-card>
            </div>
          </div>
        </template>
      </split-pane>
    </div>
  </div>
</template>

<script>
import SplitPane from 'vue-splitpane'
import labelBorder from './lable-border.vue'
import {Jmx2Json, Json2Jmx} from './jmx'


const AddContextMenuOptions = [
  {
    label: '线程（用户）',
    children: [
      {
        label: 'setUp线程组',
        match: ['TestPlan'],
      },
      {
        label: 'tearDown线程组',
        match: ['TestPlan'],
      },
      {
        label: '线程组',
        match: ['TestPlan'],
      },
    ],
  },
  {
    label: '配置元件',
    children: [
      {
        label: 'CSV Data Set Config',
        match: ['TestPlan', 'ThreadGroup', 'HTTPSamplerProxy'],
      },
      {
        label: 'HTTP信息头管理器',
        match: ['TestPlan', 'ThreadGroup', 'HTTPSamplerProxy'],
      },
      {
        label: 'HTTP Cookie管理器',
        match: ['TestPlan', 'ThreadGroup', 'HTTPSamplerProxy'],
      },
      {
        label: 'HTTP缓存管理器',
        match: ['TestPlan', 'ThreadGroup', 'HTTPSamplerProxy'],
      },
      {
        label: 'HTTP请求默认值',
        match: ['TestPlan', 'ThreadGroup', 'HTTPSamplerProxy'],
      }
    ],
  },
  {
    label: '监听器',
    children: [
      {
        label: '查看结果树',
        match: ['TestPlan']
      }
    ]
  },
  {
    label: '取样器',
    children: [
      {
        label: 'HTTP请求',
        match: ['ThreadGroup']
      },
      {
        label: 'Debug Sampler',
        match: ['ThreadGroup']
      },
      {
        label: 'HTTP请求',
        match: ['ThreadGroup']
      }
    ]
  }
]


const fullContextMenuOptions = [
  {
    label: '添加',
    children: [
      {
        label: '线程（用户）',
        children: [
          {
            label: 'setUp线程组',
            match: ['TestPlan'],
          },
          {
            label: 'tearDown线程组',
            match: ['TestPlan'],
          },
          {
            label: '线程组',
            match: ['TestPlan'],
          },
        ],
      },
      {
        label: '配置元件',
        children: [
          {
            label: 'CSV Data Set Config',
            match: ['TestPlan', 'ThreadGroup', 'HTTPSamplerProxy'],
          },
          {
            label: 'HTTP信息头管理器',
            match: ['TestPlan', 'ThreadGroup', 'HTTPSamplerProxy'],
          },
          {
            label: 'HTTP Cookie管理器',
            match: ['TestPlan', 'ThreadGroup', 'HTTPSamplerProxy'],
          },
          {
            label: 'HTTP缓存管理器',
            match: ['TestPlan', 'ThreadGroup', 'HTTPSamplerProxy'],
          },
          {
            label: 'HTTP请求默认值',
            match: ['TestPlan', 'ThreadGroup', 'HTTPSamplerProxy'],
          }
        ],
      },
      {
        label: '监听器',
        children: [
          {
            label: '查看结果树',
            match: ['TestPlan']
          }
        ]
      },
      {
        label: '取样器',
        children: [
          {
            label: 'HTTP请求',
            match: ['ThreadGroup']
          },
          {
            label: 'Debug Sampler',
            match: ['ThreadGroup']
          },
          {
            label: 'HTTP请求',
            match: ['ThreadGroup']
          }
        ]
      }
    ],
  },
  {
    label: '剪切',
    match: 'ALL',
  },
  {
    label: '复制',
    match: 'ALL',
  },
  {
    label: '粘贴',
    match: 'ALL',
  },
  {
    label: '复写',
    match: 'ALL',
  },
  {
    label: '删除',
    match: 'ALL',
  },
  {
    label: '启用',
    match: 'ALL',
  },
  {
    label: '禁用',
    match: 'ALL',
  },
  {
    label: '切换',
    match: 'ALL',
  },
]


export default {
  components: {
    SplitPane,
    labelBorder,
  },
  data() {
    return {
      filterText: '',
      props: {
        label: (data) => {
          return data['attributes']['testname'];
        },
        children: 'hashTree'
      },
      treeData: [],
      checkedData: {
        attributes: {}
      },
      argumentsSelection: [],
      contextMenuVisible: false,
      contextMenuOptions: [],

      elementIcons: {
        TestPlan: 'el-icon-edit-outline',
        ThreadGroup: 'el-icon-setting',
        HTTPSamplerProxy: 'el-icon-edit',
        HeaderManager: 'el-icon-s-operation',
        ResultCollector: 'el-icon-view',
        Arguments: 'el-icon-s-operation',
        JSONPostProcessor: 'el-icon-document',
        DebugSampler: 'el-icon-edit',
        JSR223PreProcessor: 'el-icon-document',
        ConfigTestElement: 'el-icon-s-operation',
      },

      currentNode: null,
      clipboard: null,

    }
  },

  computed: {
    activeName() {
      return this.checkedData['HTTPSampler.postBodyRaw'] ? 'body' : 'args'
    }
  },

  watch: {
    filterText(val) {
      this.$refs.veTree.filter(val)
    }
  },

  created() {
  },

  methods: {
    handleTabClick(tab) {
      switch (tab.name) {
        case 'body' :
          this.checkedData['HTTPSampler.postBodyRaw'] = true;
          if (this.checkedData['HTTPSampler.postBodyRaw'] &&
            this.checkedData['HTTPsampler.Arguments']['Arguments.arguments'].length === 0) {
            this.handleArgumentsAdd(this.checkedData['HTTPsampler.Arguments']['Arguments.arguments'], 'HTTPArgument')
          }
          break;
        case 'args':
          this.checkedData['HTTPSampler.postBodyRaw'] = false;
          break;
        case 'file':
          if (!this.checkedData.hasOwnProperty('HTTPsampler.Files')) {
            this.$set(
              this.checkedData, 'HTTPsampler.Files', {
                'HTTPFileArgs.files': [],
                attributes: {
                  name: "HTTPsampler.Files",
                  elementType: "HTTPFileArgs"
                }
              }
            )
          }
      }
    },

    filterTreeNode(value, data) {
      if (!value) return true
      return data.attributes.testname.indexOf(value) !== -1
    },
    handleTreeNodeClick(data) {
      console.log(data)
      this.contextMenuVisible = false // todo: 点击tree并不会触发click事件
      this.argumentsSelection = []
      this.checkedData = data
    },

    filterOptions(options) {
      let filteredOptions = []
      for (let option of options) {
        if (option.children !== undefined && option.children.length > 0) {
          option.children = this.filterOptions(option.children)
        }
        if ((option.match !== undefined && option.match.includes(this.checkedData.attributes.testclass))
          || (option.match === undefined && option.children.length > 0)) {
          filteredOptions.push(option)
        }
      }
      return filteredOptions
    },

    handleTreeNodeRightClick(event, data, node) {
      event.preventDefault();
      this.currentNode = node;
      this.checkedData = data;
      this.contextMenuOptions = []
      let AddOptions = JSON.parse(JSON.stringify(AddContextMenuOptions))
      AddOptions = this.filterOptions(AddOptions)
      if (AddOptions.length > 0) {
        this.contextMenuOptions.push({
          label: '添加',
          children: AddOptions,
        })
      }
      if (this.checkedData.attributes.guiclass === 'TestPlanGui') {
        this.contextMenuOptions.push({label: '粘贴'})
      } else {
        ['剪切', '复制', '粘贴', '复写', '删除'].forEach(item => this.contextMenuOptions.push({
          label: item,
        }))
      }
      this.contextMenuOptions.push.apply(this.contextMenuOptions, [{
        label: '启用',
        disabled: this.checkedData.attributes.enabled !== 'false',
      }, {
        label: '禁用',
        disabled: this.checkedData.attributes.enabled === 'false',
      }, {
        label: '切换',
      }])
      this.contextMenuVisible = true;
      const element = document.querySelector('.el-popover')
      element.style.position = 'fixed';
      element.style.left = `${event.clientX}px`;
      element.style.top = `${event.clientY}px`;
      document.addEventListener('click', (ev) => {
        if (ev.target !== element) {
          document.removeEventListener('click', undefined)
          this.contextMenuVisible = false
        }
      })
    },
    handleContextMenuClick(value) {
      if (value.length > 0) {
        this.$refs.contextMenu.clearCheckedNodes();
      }
      this.contextMenuVisible = false
      switch (value[0]) {
        case '剪切':
          if (this.currentNode !== null) {
            const index = this.currentNode.parent.childNodes.findIndex(child => child.id === this.currentNode.id);
            this.clipboard = this.currentNode.parent.data.hashTree.splice(index, 1)[0];
            this.checkedData = this.treeData[0];
            this.currentNode = null;
          }
          break;
        case '复制':
          if (this.currentNode !== null) {
            this.clipboard = this.checkedData;
          }
          break;
        case '粘贴':
          if (this.clipboard !== null) {
            this.checkedData.hashTree.push(this.clipboard)
            this.currentNode.data.hashTree = JSON.parse(JSON.stringify(this.checkedData.hashTree))
          }
          break;
        case '复写':
          const index = this.currentNode.parent.childNodes.findIndex(child => child.id === this.currentNode.id);
          this.currentNode.parent.data.hashTree.splice(index, 0, this.checkedData)
          this.currentNode.parent.data.hashTree = JSON.parse(JSON.stringify(this.currentNode.parent.data.hashTree))
          break;
        case '删除':
          if (this.currentNode !== null) {
            const index = this.currentNode.parent.childNodes.findIndex(child => child.isCurrent);
            this.currentNode.parent.data.hashTree.splice(index, 1);
            this.checkedData = this.treeData[0];
            this.currentNode = null;
          }
          break;
        case '启用':
        case '禁用':
        case '切换':
          this.$set(this.checkedData.attributes, 'enabled', String(this.checkedData.attributes.enabled === 'false'))
          break;
      }
      console.log('handleContextMenuClick', value, this.checkedData.attributes.enabled)
    },

    handleArgumentsSelectionChange(val) {
      this.argumentsSelection = val;
    },

    handleArgumentsAdd(src, elementType) {
      switch (elementType) {
        case 'Header':
          src.push({
            'Header.name': '',
            'Header.value': '',
            attributes: {elementType: elementType, name: ''}
          });
          break;
        case 'Argument':
          src.push({
            attributes: {name: "", elementType: "Argument"},
            "Argument.name": "",
            "Argument.value": "",
            "Argument.metadata": "="
          });
          break;
        case 'HTTPArgument':
          src.push({
            "Argument.name": "",
            "Argument.value": "",
            "Argument.metadata": "=",
            "HTTPArgument.always_encode": false,
            "HTTPArgument.content_type": 'text/plain',
            "HTTPArgument.use_equals": true,
            attributes: {name: '', elementType: elementType}
          });
          break;
        case 'HTTPFileArg':
          src.push({
            attributes: {
              name: '',
              elementType: 'HTTPFileArg'
            },
            "File.mimetype": '',
            "File.path": ''
          })
      }
    },
    handleArgumentsDelete(src, elementType) {
      let nameKey = 'Argument.name'
      if (elementType === 'Header') {
        nameKey = 'Header.name'
      }
      if (elementType === 'HTTPFileArg') {
        nameKey = 'File.path'
      }
      for (let val of this.argumentsSelection) {
        let index = src.findIndex(item => item[nameKey] === val[nameKey])
        if (index !== -1) {
          src.splice(index, 1)
        }
      }
    },

    handleFileUpload(file) {
      const fileReader = new FileReader()
      fileReader.onload = async (e) => {
        const xmlData = e.target.result
        this.treeData = Jmx2Json(xmlData)
        console.log(this.treeData)
      }
      fileReader.readAsText(file.raw)
    },

    handleToJmx() {
      if (this.treeData.length > 0) {
        const xml = Json2Jmx(this.treeData)
        console.log(xml)
      }
    }
  }
}
</script>

<style scoped>
.components-container {
  position: relative;
  height: calc(100vh - 50px);
}

.filter-input {
  padding: 10px;
}

.filter-input >>> .el-input__inner {
  border-radius: 30px;
}

.left-container {
  height: 100%;
}

.right-container {
  background-color: #efefef;
  height: 100%;
  white-space: pre;
  overflow: auto;
}

.arguments-table >>> .el-input__inner {
  border: 0 !important;
  box-shadow: none !important;
  padding-left: 2px;
}


</style>
<style>
.el-cascader-menu__wrap {
  height: auto !important;
}
</style>
