import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Code2, 
  Info, 
  ShieldCheck, 
  Star, 
  GitFork, 
  Eye, 
  Search,
  ChevronDown,
  FileCode,
  Folder,
  History,
  AlertCircle,
  Lock,
  MessageSquare,
  Play,
  FileText,
  Terminal,
  Clock,
  Unlock
} from 'lucide-react';

const RepositoryHeader = ({ repoName, isConfidential, activeTab, setActiveTab }) => (
  <div className="bg-[#0d1117] border-b border-[#30363d] pt-8 pb-0">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 text-xl">
          <BookOpen className="w-5 h-5 text-[#8b949e]" />
          <Link to="/" className="text-[#58a6ff] hover:underline">DigitalIntegrityPartners</Link>
          <span className="text-[#8b949e]">/</span>
          <Link to="/" className="font-bold text-[#58a6ff] hover:underline">{repoName}</Link>
          <span className="px-2 py-0.5 rounded-full border border-[#30363d] text-[#8b949e] text-xs font-medium ml-1">
            {isConfidential ? 'Private' : 'Public'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] px-3 py-1.5 rounded-md text-xs font-bold transition-colors">
            <Eye className="w-4 h-4 text-[#8b949e]" /> Watch <span className="bg-[#30363d] px-1.5 rounded-full ml-1">42</span>
          </button>
          <button className="flex items-center gap-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] px-3 py-1.5 rounded-md text-xs font-bold transition-colors">
            <GitFork className="w-4 h-4 text-[#8b949e]" /> Fork <span className="bg-[#30363d] px-1.5 rounded-full ml-1">12</span>
          </button>
          <button className="flex items-center gap-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] px-3 py-1.5 rounded-md text-xs font-bold transition-colors">
            <Star className="w-4 h-4 text-[#8b949e]" /> Star <span className="bg-[#30363d] px-1.5 rounded-full ml-1">128</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <TabItem 
            icon={<Code2 className="w-4 h-4" />} 
            label="Code" 
            active={activeTab === 'code'} 
            onClick={() => setActiveTab('code')}
        />
        <TabItem 
            icon={<AlertCircle className="w-4 h-4" />} 
            label="Issues" 
            count={3} 
            active={activeTab === 'issues'} 
            onClick={() => setActiveTab('issues')}
        />
        <TabItem 
            icon={<Play className="w-4 h-4" />} 
            label="Actions" 
            active={activeTab === 'actions'} 
            onClick={() => setActiveTab('actions')}
        />
        <TabItem 
            icon={<ShieldCheck className="w-4 h-4" />} 
            label="Security" 
            active={activeTab === 'security'} 
            onClick={() => setActiveTab('security')}
        />
        <TabItem 
            icon={<Info className="w-4 h-4" />} 
            label="Wiki" 
            active={activeTab === 'wiki'} 
            onClick={() => setActiveTab('wiki')}
        />
      </div>
    </div>
  </div>
);

const TabItem = ({ icon, label, count, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors border-b-2 ${active ? 'border-[#f78166] text-[#f0f6fc]' : 'border-transparent text-[#8b949e] hover:bg-[#30363d]/30 hover:text-[#f0f6fc]'}`}
  >
    {icon}
    <span>{label}</span>
    {count !== undefined && <span className="bg-[#30363d] px-1.5 py-0.5 rounded-full text-[10px] font-bold">{count}</span>}
  </button>
);

const FileList = ({ files }) => (
  <div className="border border-[#30363d] rounded-md overflow-hidden bg-[#0d1117] mb-8">
    <div className="bg-[#161b22] p-4 border-b border-[#30363d] flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500"></div>
        <span className="text-sm font-bold text-[#f0f6fc]">sayeemx</span>
        <span className="text-sm text-[#8b949e]">Initial commit of confidential research PTH-CRIT-2024-4892</span>
      </div>
      <div className="text-xs text-[#8b949e]">
        last week • <span className="text-[#f0f6fc]">34 commits</span>
      </div>
    </div>
    <div className="divide-y divide-[#30363d]">
      {files.map((file, idx) => (
        <div key={idx} className="p-3 flex items-center justify-between hover:bg-[#161b22] transition-colors group">
          <div className="flex items-center gap-3">
            {file.type === 'folder' ? <Folder className="w-4 h-4 text-[#7d8590]" /> : <FileCode className="w-4 h-4 text-[#7d8590]" />}
            <span className="text-sm text-[#f0f6fc] group-hover:text-[#58a6ff] group-hover:underline cursor-pointer">{file.name}</span>
          </div>
          <div className="flex items-center gap-12">
            <span className="text-sm text-[#8b949e] hidden md:inline">{file.message}</span>
            <span className="text-sm text-[#8b949e] w-24 text-right">{file.date}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Home = () => {
  const [activeTab, setActiveTab] = useState('code');
  const [tokenInput, setTokenInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  const files = [
    { name: '.github', type: 'folder', message: 'Add security-disclosure-workflow', date: 'last week' },
    { name: 'research', type: 'folder', message: 'Add initial vulnerability analysis', date: '3 days ago' },
    { name: 'evidence', type: 'folder', message: 'Confidential PoC documents (Encrypted)', date: 'yesterday' },
    { name: 'tools', type: 'folder', message: 'Simulation scripts for proof-of-concept', date: '5 days ago' },
    { name: '.gitignore', type: 'file', message: 'Initial commit', date: 'last week' },
    { name: 'LICENSE', type: 'file', message: 'Add MIT License', date: 'last week' },
    { name: 'README.md', type: 'file', message: 'Update project overview', date: 'today' },
  ];

  const handleUnlock = () => {
    if (tokenInput.trim().length > 5) {
        setIsUnlocked(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-sans">
      <RepositoryHeader 
        repoName="PTH-CRIT-2024-4892" 
        isConfidential={true} 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'code' && (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-2 bg-[#21262d] border border-[#30363d] px-3 py-1.5 rounded-md text-xs font-bold text-[#f0f6fc] hover:bg-[#30363d]">
                        main <ChevronDown className="w-3 h-3" />
                      </button>
                      <div className="flex items-center gap-2 ml-4 text-sm text-[#8b949e] hidden sm:flex">
                        <GitFork className="w-4 h-4" /> <strong>1</strong> branch
                        <Star className="w-4 h-4 ml-2" /> <strong>0</strong> tags
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative hidden md:block">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b949e]" />
                          <input 
                              type="text" 
                              placeholder="Go to file" 
                              className="bg-[#0d1117] border border-[#30363d] rounded-md pl-9 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-[#58a6ff] focus:border-[#58a6ff] outline-none"
                          />
                      </div>
                      <button className="bg-[#238636] hover:bg-[#2ea043] text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors">
                        Code
                      </button>
                    </div>
                  </div>

                  <FileList files={files} />

                  {/* README Section */}
                  <div className="border border-[#30363d] rounded-md overflow-hidden bg-[#0d1117]">
                      <div className="bg-[#161b22] p-3 border-b border-[#30363d] flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-[#8b949e]" />
                          <span className="text-xs font-bold text-[#f0f6fc]">README.md</span>
                      </div>
                      <div className="p-8 prose prose-invert max-w-none">
                          <h1 className="border-b border-[#30363d] pb-2 mb-6 text-3xl font-bold text-[#f0f6fc]">Patha Courier: Security Analysis</h1>
                          
                          <div className="bg-[#f851491a] border border-[#f8514966] rounded-md p-4 mb-8">
                              <div className="flex items-center gap-2 text-[#f85149] mb-2 font-bold uppercase tracking-wider text-xs">
                                  <AlertCircle className="w-5 h-5" />
                                  Critical Vulnerability Disclosure
                              </div>
                              <p className="text-sm text-[#c9d1d9]">
                                  <strong>Case Reference:</strong> PTH-CRIT-2024-4892 | <strong>Status:</strong> AWAITING CLIENT ACKNOWLEDGEMENT
                              </p>
                          </div>

                          <h2 className="text-xl font-bold mb-4 text-[#f0f6fc]">Project Overview</h2>
                          <p className="mb-6 leading-relaxed text-[#8b949e]">
                              This repository serves as a demonstration platform for anonymously reporting security vulnerabilities found during the "Patha is never designed to be secured" research initiative. 
                              The simulation demonstrates how a professional "White Hat" security firm, <strong>Digital Integrity Partners</strong>, discloses critical findings.
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                              <div className="bg-[#161b22] p-6 rounded-lg border border-[#30363d]">
                                  <h3 className="font-bold mb-3 flex items-center gap-2 text-[#f0f6fc]">
                                      <ShieldCheck className="w-4 h-4 text-[#3fb950]" /> Verified Findings
                                  </h3>
                                  <ul className="text-sm space-y-3 text-[#8b949e]">
                                      <li className="flex gap-2"><span>•</span> <span><strong>CVSS 9.8:</strong> Unauthenticated API Access to Customer PII</span></li>
                                      <li className="flex gap-2"><span>•</span> <span><strong>CVSS 8.4:</strong> Settlement Layer Transaction Manipulation</span></li>
                                      <li className="flex gap-2"><span>•</span> <span><strong>CVSS 7.2:</strong> Information Leakage via Debug Endpoints</span></li>
                                  </ul>
                              </div>
                              <div className="bg-[#161b22] p-6 rounded-lg border border-[#30363d]">
                                  <h3 className="font-bold mb-3 flex items-center gap-2 text-[#f0f6fc]">
                                      <Lock className="w-4 h-4 text-[#d29922]" /> Data Protection
                                  </h3>
                                  <p className="text-sm text-[#8b949e] leading-relaxed">
                                      All evidence files (PoC) in the <code className="bg-[#30363d] px-1.5 py-0.5 rounded text-[#f0f6fc]">/evidence</code> directory are encrypted with GPG using the client-specific token as the passphrase.
                                  </p>
                                  <div className="mt-4 p-3 bg-black/30 rounded border border-[#30363d] flex items-center gap-2 text-xs">
                                      <Terminal className="w-4 h-4 text-[#3fb950]" />
                                      <code className="text-[#8b949e]">gpg --decrypt evidence_poc_01.gpg</code>
                                  </div>
                              </div>
                          </div>

                          <div className="bg-[#21262d] p-8 rounded-lg border border-[#30363d] text-center relative overflow-hidden">
                              {isUnlocked ? (
                                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                      <Unlock className="w-12 h-12 text-[#3fb950] mx-auto mb-4" />
                                      <h3 className="text-xl font-bold mb-2 text-[#f0f6fc]">ACCESS GRANTED</h3>
                                      <p className="text-sm text-[#8b949e] mb-6">The evidence vault has been decrypted. You can now view all technical documentation.</p>
                                      <Link to="/evidence" className="inline-block bg-[#238636] hover:bg-[#2ea043] text-white px-6 py-2 rounded-md font-bold transition-colors">
                                          View Full Report
                                      </Link>
                                  </motion.div>
                              ) : (
                                  <>
                                      <Lock className="w-12 h-12 text-[#8b949e] mx-auto mb-4" />
                                      <h3 className="text-xl font-bold mb-2 text-[#f0f6fc]">CONFIDENTIAL GATEWAY</h3>
                                      <p className="text-sm text-[#8b949e] mb-6">Enter your 72-hour access token to decrypt the full disclosure report.</p>
                                      <div className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
                                          <input 
                                              type="text" 
                                              placeholder="PTH-CRIT-XXXX-XXXX" 
                                              value={tokenInput}
                                              onChange={(e) => setTokenInput(e.target.value)}
                                              className="bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm w-full outline-none focus:border-[#58a6ff] text-center tracking-widest font-mono"
                                          />
                                          <button 
                                            onClick={handleUnlock}
                                            className="bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] px-4 py-2 rounded-md text-sm font-bold transition-colors whitespace-nowrap"
                                          >
                                              Verify Token
                                          </button>
                                      </div>
                                  </>
                              )}
                          </div>
                      </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold mb-3 text-[#f0f6fc]">About</h3>
                    <p className="text-sm mb-4 leading-relaxed text-[#8b949e]">
                      Demonstration platform for anonymously reporting security vulnerabilities to Patha Courier. 
                      Managed by Digital Integrity Partners.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-[#8b949e] hover:text-[#58a6ff] cursor-pointer">
                          <MessageSquare className="w-4 h-4" />
                          <span>Discussions</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#8b949e] hover:text-[#58a6ff] cursor-pointer">
                          <Star className="w-4 h-4" />
                          <span>128 stars</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#8b949e] hover:text-[#58a6ff] cursor-pointer">
                          <Eye className="w-4 h-4" />
                          <span>42 watching</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#8b949e] hover:text-[#58a6ff] cursor-pointer">
                          <GitFork className="w-4 h-4" />
                          <span>12 forks</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#30363d] pt-6">
                      <h3 className="text-sm font-bold mb-3 text-[#f0f6fc]">Releases</h3>
                      <div className="flex items-center gap-2 text-[#58a6ff] hover:underline cursor-pointer text-sm">
                          <span className="w-2 h-2 rounded-full bg-[#238636]"></span>
                          v1.0.4-beta (Latest)
                      </div>
                      <p className="text-xs text-[#8b949e] mt-1 ml-4">2 days ago</p>
                  </div>

                  <div className="border-t border-[#30363d] pt-6">
                      <h3 className="text-sm font-bold mb-3 text-[#f0f6fc]">Languages</h3>
                      <div className="w-full h-2 rounded-full flex overflow-hidden mb-2">
                          <div className="bg-[#f1e05a] h-full" style={{ width: '65%' }}></div>
                          <div className="bg-[#e34c26] h-full" style={{ width: '25%' }}></div>
                          <div className="bg-[#563d7c] h-full" style={{ width: '10%' }}></div>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold">
                              <span className="w-2 h-2 rounded-full bg-[#f1e05a]"></span> JavaScript 65.2%
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold">
                              <span className="w-2 h-2 rounded-full bg-[#e34c26]"></span> HTML 25.1%
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold">
                              <span className="w-2 h-2 rounded-full bg-[#563d7c]"></span> CSS 9.7%
                          </div>
                      </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'issues' && (
            <motion.div
              key="issues"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="border border-[#30363d] rounded-md bg-[#0d1117] overflow-hidden"
            >
              <div className="bg-[#161b22] p-4 border-b border-[#30363d] flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm font-bold">
                    <span className="text-[#f0f6fc] flex items-center gap-1"><AlertCircle className="w-4 h-4 text-[#3fb950]" /> 3 Open</span>
                    <span className="text-[#8b949e] flex items-center gap-1">0 Closed</span>
                </div>
              </div>
              <div className="divide-y divide-[#30363d]">
                <IssueItem title="Clarification needed on PTH-4892 encryption algorithm" author="Patha-Sec" date="2 days ago" labels={['question']} />
                <IssueItem title="Inconsistent behavior in settlement layer API" author="sayeemx" date="4 days ago" labels={['bug']} />
                <IssueItem title="Add more proof-of-concept videos for vulnerability PTH-02" author="sayeemx" date="1 week ago" labels={['enhancement']} />
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8">
                <ShieldCheck className="w-12 h-12 text-[#58a6ff] mb-6" />
                <h2 className="text-2xl font-bold mb-4 text-[#f0f6fc]">Security Policy</h2>
                <p className="text-[#8b949e] mb-8">
                    Digital Integrity Partners adheres to a strict responsible disclosure policy. 
                    All research conducted on Patha Courier systems was performed under controlled conditions with zero impact on live customer data.
                </p>
                
                <h3 className="font-bold mb-4 text-[#f0f6fc]">Advisories</h3>
                <div className="space-y-4">
                    <div className="p-4 bg-[#0d1117] border border-[#30363d] rounded-md flex items-center justify-between">
                        <div>
                            <p className="font-bold text-[#f0f6fc]">PTH-CRIT-2024-4892</p>
                            <p className="text-xs text-[#8b949e]">Critical Settlement Layer Vulnerability</p>
                        </div>
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-[10px] font-bold uppercase">Critical</span>
                    </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-[#30363d] mt-20">
        <div className="flex flex-wrap items-center justify-between gap-6 opacity-60">
            <div className="flex items-center gap-2 text-xs font-bold">
                <GitFork className="w-4 h-4" />
                <span>© 2026 DIGITAL INTEGRITY PARTNERS</span>
            </div>
            <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest">
                <span className="hover:text-[#58a6ff] cursor-pointer">Terms</span>
                <span className="hover:text-[#58a6ff] cursor-pointer">Privacy</span>
                <span className="hover:text-[#58a6ff] cursor-pointer">Security</span>
                <span className="hover:text-[#58a6ff] cursor-pointer">Status</span>
                <span className="hover:text-[#58a6ff] cursor-pointer">Docs</span>
            </div>
        </div>
      </footer>
    </div>
  );
};

const IssueItem = ({ title, author, date, labels }) => (
  <div className="p-4 hover:bg-[#161b22] transition-colors cursor-pointer group">
    <div className="flex items-start gap-2 mb-1">
        <AlertCircle className="w-4 h-4 text-[#3fb950] mt-1" />
        <span className="font-bold text-[#f0f6fc] group-hover:text-[#58a6ff]">{title}</span>
        <div className="flex gap-1">
            {labels.map(l => (
                <span key={l} className={`text-[10px] px-2 py-0.5 rounded-full border border-[#30363d] ${l === 'bug' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>{l}</span>
            ))}
        </div>
    </div>
    <div className="text-xs text-[#8b949e] ml-6">
        #{Math.floor(Math.random() * 1000)} opened {date} by <span className="hover:text-[#58a6ff]">{author}</span>
    </div>
  </div>
);

export default Home;