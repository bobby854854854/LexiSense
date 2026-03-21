import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { contractsAPI, versionsAPI, workflowAPI } from '../api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  Calendar,
  Building,
  DollarSign,
  Send,
  Loader2,
  MessageSquare,
  Shield,
  Lightbulb,
  Bot,
  History,
  RotateCcw,
  CheckCircle,
  XCircle,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

const RiskBadge = ({ level, size = 'default' }) => {
  const colors = {
    high: 'bg-red-500/10 text-red-500 border-red-500/20',
    medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    low: 'bg-green-500/10 text-green-500 border-green-500/20',
  };
  return (
    <Badge
      variant="outline"
      className={`${colors[level] || 'bg-gray-500/10 text-gray-500'} ${size === 'lg' ? 'text-sm px-3 py-1' : ''}`}
    >
      {level || 'Unknown'}
    </Badge>
  );
};

const StatusBadge = ({ status }) => {
  const colors = {
    active: 'bg-green-500/10 text-green-500',
    draft: 'bg-blue-500/10 text-blue-500',
    expired: 'bg-gray-500/10 text-gray-500',
    pending: 'bg-yellow-500/10 text-yellow-500',
    review: 'bg-orange-500/10 text-orange-500',
    approved: 'bg-emerald-500/10 text-emerald-500',
  };
  const labels = {
    review: 'In Review',
    approved: 'Approved',
    active: 'Active',
    draft: 'Draft',
    expired: 'Expired',
    pending: 'Pending',
  };
  return (
    <Badge variant="secondary" className={colors[status] || colors.draft}>
      {labels[status] || status || 'draft'}
    </Badge>
  );
};

export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [versions, setVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState(null);
  const [workflowData, setWorkflowData] = useState(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchContract();
    fetchVersions();
    fetchWorkflow();
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchContract = async () => {
    try {
      const response = await contractsAPI.get(id);
      setContract(response.data);
    } catch (error) {
      toast.error('Failed to load contract');
      navigate('/contracts');
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    setVersionsLoading(true);
    try {
      const response = await versionsAPI.getVersions(id);
      setVersions(response.data);
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setVersionsLoading(false);
    }
  };

  const fetchWorkflow = async () => {
    try {
      const response = await workflowAPI.getHistory(id);
      setWorkflowData(response.data);
    } catch (error) {
      console.error('Failed to load workflow:', error);
    }
  };

  const handleWorkflowAction = async (action) => {
    setWorkflowLoading(true);
    try {
      await workflowAPI.performAction(id, action);
      toast.success(`Action "${action.replace(/_/g, ' ')}" completed`);
      fetchContract();
      fetchWorkflow();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Workflow action failed');
    } finally {
      setWorkflowLoading(false);
    }
  };

  const handleRestoreVersion = async (versionNum) => {
    if (!window.confirm(`Restore contract to version ${versionNum}? This will create a new version with the current state.`)) {
      return;
    }
    
    setRestoringVersion(versionNum);
    try {
      await versionsAPI.restore(id, versionNum);
      toast.success(`Contract restored to version ${versionNum}`);
      fetchContract();
      fetchVersions();
    } catch (error) {
      toast.error('Failed to restore version');
    } finally {
      setRestoringVersion(null);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const question = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { type: 'user', content: question }]);
    setChatLoading(true);

    try {
      const response = await contractsAPI.chat(id, question);
      setChatMessages((prev) => [...prev, { type: 'assistant', content: response.data.answer }]);
    } catch (error) {
      toast.error('Failed to get response');
      setChatMessages((prev) => [
        ...prev,
        { type: 'error', content: 'Failed to get response. Please try again.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-48" />
              <Skeleton className="h-96" />
            </div>
            <Skeleton className="h-[600px]" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!contract) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Contract not found</p>
          <Button className="mt-4" onClick={() => navigate('/contracts')}>
            Back to Contracts
          </Button>
        </div>
      </Layout>
    );
  }

  const analysis = contract.aiAnalysis || {};

  return (
    <Layout>
      <div className="space-y-6" data-testid="contract-detail-page">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/contracts')} data-testid="back-btn">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{contract.title}</h1>
              <StatusBadge status={contract.status} />
              {contract.riskLevel && <RiskBadge level={contract.riskLevel} size="lg" />}
            </div>
            <p className="text-muted-foreground mt-1">
              {contract.contractType} • Uploaded by {contract.uploaderEmail || 'Unknown'}
            </p>
          </div>
        </div>

        {/* Workflow Actions */}
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Zap className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Workflow:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['draft', 'review', 'approved', 'active'].map((step, i) => {
                    const isCurrent = contract.status === step;
                    const isPast = ['draft', 'review', 'approved', 'active'].indexOf(contract.status) > i;
                    return (
                      <span key={step} className="flex items-center gap-1.5">
                        {i > 0 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
                        <Badge
                          variant={isCurrent ? 'default' : isPast ? 'secondary' : 'outline'}
                          className={`text-xs ${isCurrent ? '' : isPast ? 'opacity-70' : 'opacity-40'}`}
                        >
                          {step === 'review' ? 'In Review' : step.charAt(0).toUpperCase() + step.slice(1)}
                        </Badge>
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap" data-testid="workflow-actions">
                {contract.status === 'draft' && (
                  <Button size="sm" onClick={() => handleWorkflowAction('submit_for_review')} disabled={workflowLoading} data-testid="workflow-submit">
                    {workflowLoading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1 h-3.5 w-3.5" />}
                    Submit for Review
                  </Button>
                )}
                {contract.status === 'review' && (
                  <>
                    <Button size="sm" variant="default" onClick={() => handleWorkflowAction('approve')} disabled={workflowLoading} data-testid="workflow-approve">
                      <CheckCircle className="mr-1 h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleWorkflowAction('reject')} disabled={workflowLoading} data-testid="workflow-reject">
                      <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                    </Button>
                  </>
                )}
                {contract.status === 'approved' && (
                  <Button size="sm" onClick={() => handleWorkflowAction('activate')} disabled={workflowLoading} data-testid="workflow-activate">
                    <CheckCircle className="mr-1 h-3.5 w-3.5" /> Activate
                  </Button>
                )}
              </div>
            </div>
            {/* Workflow History */}
            {workflowData?.history?.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">Recent Workflow Activity</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {workflowData.history.slice(-5).reverse().map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ArrowRight className="h-3 w-3 shrink-0" />
                      <span className="font-medium">{entry.userEmail}</span>
                      <span>{entry.action.replace(/_/g, ' ')}</span>
                      <span>({entry.fromStatus} &rarr; {entry.toStatus})</span>
                      <span className="ml-auto whitespace-nowrap">{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Building className="h-4 w-4" />
                    Counterparty
                  </div>
                  <p className="font-medium mt-1">{contract.counterparty || 'Not specified'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <DollarSign className="h-4 w-4" />
                    Value
                  </div>
                  <p className="font-medium mt-1">{contract.value || 'Not specified'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                    Effective
                  </div>
                  <p className="font-medium mt-1">
                    {contract.effectiveDate || 'Not specified'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                    Expiry
                  </div>
                  <p className="font-medium mt-1">
                    {contract.expiryDate || 'Not specified'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Analysis Tabs */}
            <Card>
              <Tabs defaultValue="summary" className="w-full">
                <CardHeader className="pb-0">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="risks">Risks</TabsTrigger>
                    <TabsTrigger value="terms">Key Terms</TabsTrigger>
                    <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent className="pt-6">
                  <TabsContent value="summary" className="mt-0">
                    {analysis.summary ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p>{analysis.summary}</p>
                        {analysis.parties && analysis.parties.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Parties Involved:</h4>
                            <ul className="list-disc pl-4">
                              {analysis.parties.map((party, i) => (
                                <li key={i}>{party}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No summary available</p>
                    )}
                  </TabsContent>

                  <TabsContent value="risks" className="mt-0">
                    {analysis.risks && analysis.risks.length > 0 ? (
                      <div className="space-y-4">
                        {analysis.risks.map((risk, i) => (
                          <div
                            key={i}
                            className="p-4 rounded-lg border border-border bg-card"
                          >
                            <div className="flex items-start gap-3">
                              <AlertTriangle
                                className={`h-5 w-5 mt-0.5 ${
                                  risk.severity === 'high'
                                    ? 'text-red-500'
                                    : risk.severity === 'medium'
                                    ? 'text-yellow-500'
                                    : 'text-green-500'
                                }`}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{risk.risk}</p>
                                  <RiskBadge level={risk.severity} />
                                </div>
                                {risk.recommendation && (
                                  <p className="text-sm text-muted-foreground mt-2">
                                    <span className="font-medium">Recommendation:</span>{' '}
                                    {risk.recommendation}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No risks identified</p>
                    )}
                  </TabsContent>

                  <TabsContent value="terms" className="mt-0">
                    {analysis.keyTerms && analysis.keyTerms.length > 0 ? (
                      <ul className="space-y-2">
                        {analysis.keyTerms.map((term, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-primary mt-1" />
                            <span>{term}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">No key terms extracted</p>
                    )}
                  </TabsContent>

                  <TabsContent value="recommendations" className="mt-0">
                    {analysis.recommendations && analysis.recommendations.length > 0 ? (
                      <ul className="space-y-2">
                        {analysis.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500 mt-1" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">No recommendations available</p>
                    )}
                  </TabsContent>

                  <TabsContent value="history" className="mt-0">
                    {versionsLoading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-16" />
                        ))}
                      </div>
                    ) : versions.length === 0 ? (
                      <div className="text-center py-8">
                        <History className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground">No version history yet</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Versions are created when the contract is updated
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {versions.map((version) => (
                          <div
                            key={version.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <History className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">Version {version.version}</p>
                                <p className="text-sm text-muted-foreground">
                                  {version.changedByEmail || 'Unknown user'} •{' '}
                                  {new Date(version.createdAt).toLocaleString()}
                                </p>
                                {version.changeReason && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {version.changeReason}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestoreVersion(version.version)}
                              disabled={restoringVersion === version.version}
                              data-testid={`restore-version-${version.version}`}
                            >
                              {restoringVersion === version.version ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Restore
                                </>
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* AI Chat Sidebar */}
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="h-5 w-5 text-primary" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1 p-4">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">
                    Ask questions about this contract
                  </p>
                  <div className="mt-4 space-y-2">
                    {[
                      'What are the key obligations?',
                      'Summarize the payment terms',
                      'What are the termination conditions?',
                    ].map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        className="text-xs w-full justify-start"
                        onClick={() => setChatInput(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-4 py-2 ${
                          msg.type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : msg.type === 'error'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-4 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
            </ScrollArea>
            <div className="p-4 border-t">
              <form onSubmit={handleChat} className="flex gap-2">
                <Input
                  placeholder="Ask about this contract..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={chatLoading}
                  data-testid="chat-input"
                />
                <Button type="submit" size="icon" disabled={chatLoading || !chatInput.trim()} data-testid="chat-send">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
