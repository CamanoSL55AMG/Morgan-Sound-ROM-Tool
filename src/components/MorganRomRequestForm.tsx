import { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  ShieldCheck,
} from 'lucide-react';

type ChecklistSection = {
  section: string;
  items: string[];
};

type ProjectState = {
  romRequestedBy: string;
  projectName: string;
  client: string;
  siteAddress: string;
  salesRep: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  romDueDate: string;
  targetBudgetRange: string;
  clientObjective: string;
  projectWalkStatus: string;
  drawingsReceived: string;
  existingSystemVerified: string;
  permitCodeReview: string;
  summary: string;
  customerSummary: string;
  assumptions: string;
  exclusions: string;
  reviewer: string;
  salesApprovalName: string;
  salesApprovalDate: string;
  estimatingApprovalName: string;
  estimatingApprovalDate: string;
  documentNumber: string;
  riskFlags: string;
  notes: string;
};

const checklistSections: ChecklistSection[] = [
  {
    section: 'Required Intake',
    items: [
      'ROM requested by identified',
      'Project name confirmed',
      'Client / end user confirmed',
      'Site address confirmed',
      'Sales rep assigned',
      'Primary contact collected',
      'ROM due date confirmed',
      'Client objective documented',
      'Target budget range documented',
      'Assumptions entered',
      'Exclusions entered',
    ],
  },
  {
    section: 'Project & Technical Backup',
    items: [
      'Project walk completed or site conditions noted',
      'Drawings received',
      'Existing system verified',
      'Known issues or failure symptoms documented',
      'Photos collected',
      'Affected rooms, floors, or zones identified',
      'Permit / code review needed identified',
    ],
  },
  {
    section: 'Internal Review',
    items: [
      'Estimating reviewer assigned',
      'Labor basis confirmed',
      'Material and freight assumptions noted',
      'Lead-time concerns identified',
      'Customer-facing summary prepared',
      'Internal handoff ready',
    ],
  },
];

const criticalChecklistItems = [
  'ROM requested by identified',
  'Project name confirmed',
  'Client / end user confirmed',
  'Site address confirmed',
  'Sales rep assigned',
  'Primary contact collected',
  'ROM due date confirmed',
  'Client objective documented',
  'Target budget range documented',
  'Assumptions entered',
  'Exclusions entered',
];

const initialProjectState: ProjectState = {
  romRequestedBy: '',
  projectName: '',
  client: '',
  siteAddress: '',
  salesRep: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  romDueDate: '',
  targetBudgetRange: '',
  clientObjective: '',
  projectWalkStatus: '',
  drawingsReceived: '',
  existingSystemVerified: '',
  permitCodeReview: '',
  summary: '',
  customerSummary: '',
  assumptions: '',
  exclusions: '',
  reviewer: '',
  salesApprovalName: '',
  salesApprovalDate: '',
  estimatingApprovalName: '',
  estimatingApprovalDate: '',
  documentNumber: '',
  riskFlags: '',
  notes: '',
};

type TabKey = 'project' | 'checklist' | 'review' | 'notes';

type RiskState = {
  label: 'Green' | 'Yellow' | 'Red';
  description: string;
  toneClass: string;
};

function createInitialChecks() {
  const state: Record<string, boolean> = {};
  checklistSections.forEach((section) => {
    section.items.forEach((item) => {
      state[item] = false;
    });
  });
  return state;
}

export default function MorganRomRequestForm() {
  const [activeTab, setActiveTab] = useState<TabKey>('project');
  const [project, setProject] = useState<ProjectState>(initialProjectState);
  const [checks, setChecks] = useState<Record<string, boolean>>(createInitialChecks);

  const completion = useMemo(() => {
    const total = Object.keys(checks).length;
    const done = Object.values(checks).filter(Boolean).length;
    return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
  }, [checks]);

  const primaryContactValue = [project.contactName, project.contactEmail, project.contactPhone]
    .filter(Boolean)
    .join(' | ');

  const missingRequired = useMemo(
    () =>
      [
        ['ROM Requested By', project.romRequestedBy],
        ['Project Name', project.projectName],
        ['Client / End User', project.client],
        ['Site Address', project.siteAddress],
        ['Sales Rep', project.salesRep],
        ['Primary Contact', primaryContactValue],
        ['ROM Due Date', project.romDueDate],
        ['Client Objective', project.clientObjective],
        ['Target Budget Range', project.targetBudgetRange],
        ['Assumptions', project.assumptions],
        ['Exclusions', project.exclusions],
      ].filter(([, value]) => !String(value || '').trim()),
    [project, primaryContactValue],
  );

  const criticalMissingCount = criticalChecklistItems.filter((item) => !checks[item]).length;

  const riskStatus: RiskState = useMemo(() => {
    if (missingRequired.length > 0 || criticalMissingCount >= 3) {
      return {
        label: 'Red',
        description: 'Missing critical information. Hold before ROM release.',
        toneClass: 'risk-card risk-red',
      };
    }
    if (criticalMissingCount > 0 || completion.percent < 85) {
      return {
        label: 'Yellow',
        description: 'ROM may proceed with documented assumptions and reviewer awareness.',
        toneClass: 'risk-card risk-yellow',
      };
    }
    return {
      label: 'Green',
      description: 'Enough information is present to issue ROM.',
      toneClass: 'risk-card risk-green',
    };
  }, [completion.percent, criticalMissingCount, missingRequired.length]);

  const updateProject = (key: keyof ProjectState, value: string) => {
    setProject((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCheck = (item: string) => {
    setChecks((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const renderInput = (
    label: string,
    key: keyof ProjectState,
    options?: { required?: boolean; textarea?: boolean; placeholder?: string },
  ) => {
    const placeholder = options?.placeholder ?? label;
    const required = options?.required ?? false;
    const value = project[key];

    return (
      <label className="field">
        <span className="field-label">
          {label}
          {required ? ' *' : ''}
        </span>
        {options?.textarea ? (
          <textarea
            className="field-control textarea"
            placeholder={`${placeholder}${required ? ' *' : ''}`}
            value={value}
            onChange={(e) => updateProject(key, e.target.value)}
          />
        ) : (
          <input
            className="field-control"
            placeholder={`${placeholder}${required ? ' *' : ''}`}
            value={value}
            onChange={(e) => updateProject(key, e.target.value)}
          />
        )}
      </label>
    );
  };

  const exportPDF = () => {
    if (missingRequired.length) {
      alert(
        `Please complete all required fields before exporting:\n\n${missingRequired
          .map(([label]) => `• ${label}`)
          .join('\n')}`,
      );
      return;
    }

    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const left = 40;
    const pageWidth = 612;
    const right = pageWidth - 40;
    let y = 40;

    const addPageChrome = (firstPage = false) => {
      if (firstPage) {
        doc.setDrawColor(180);
        doc.rect(left, y, right - left, 44);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('Morgan Sound ROM Request Form', left + 12, y + 18);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(
          'Phase 1 intake form with required fields, review checklist, and approvals',
          left + 12,
          y + 32,
        );
        doc.text(project.documentNumber ? `Doc No: ${project.documentNumber}` : 'Doc No: Pending', right - 120, y + 18);
        doc.text(new Date().toLocaleDateString(), right - 120, y + 32);
        y += 60;
      } else {
        doc.setDrawColor(220);
        doc.line(left, 24, right, 24);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Morgan Sound ROM Request Form', left, 18);
        y = 40;
      }
    };

    const ensureSpace = (threshold = 730) => {
      if (y > threshold) {
        doc.addPage();
        addPageChrome(false);
      }
    };

    const addWrappedText = (label: string, value: string, spacing = 18) => {
      if (!value) return;
      ensureSpace();
      doc.setFont('helvetica', 'bold');
      doc.text(label, left, y);
      y += 14;
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(value, right - left);
      doc.text(lines, left, y);
      y += lines.length * spacing + 6;
      ensureSpace();
    };

    addPageChrome(true);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Completion: ${completion.done}/${completion.total} (${completion.percent}%)`, left, y);
    y += 14;
    doc.text(`Risk Status: ${riskStatus.label} - ${riskStatus.description}`, left, y);
    y += 22;

    addWrappedText('ROM Requested By', project.romRequestedBy);
    addWrappedText('Project Name', project.projectName);
    addWrappedText('Client / End User', project.client);
    addWrappedText('Site Address', project.siteAddress);
    addWrappedText('Sales Rep', project.salesRep);
    addWrappedText('Primary Contact', primaryContactValue);
    addWrappedText('ROM Due Date', project.romDueDate);
    addWrappedText('Target Budget Range', project.targetBudgetRange);
    addWrappedText('Client Objective', project.clientObjective);
    addWrappedText('Project Walk Completed / Status', project.projectWalkStatus);
    addWrappedText('Drawings Received', project.drawingsReceived);
    addWrappedText('Existing System Verified', project.existingSystemVerified);
    addWrappedText('Permit / Code Review Needed', project.permitCodeReview);
    addWrappedText('Scope Summary', project.summary);
    addWrappedText('Customer-Facing Summary', project.customerSummary);
    addWrappedText('Assumptions', project.assumptions);
    addWrappedText('Exclusions', project.exclusions);
    addWrappedText('Internal Reviewer', project.reviewer);
    addWrappedText(
      'Sales Approval',
      [project.salesApprovalName, project.salesApprovalDate].filter(Boolean).join(' | '),
    );
    addWrappedText(
      'Estimating Approval',
      [project.estimatingApprovalName, project.estimatingApprovalDate].filter(Boolean).join(' | '),
    );
    addWrappedText('Document Number', project.documentNumber);
    addWrappedText('Risk Status', `${riskStatus.label} - ${riskStatus.description}`);
    addWrappedText('Risk Flags', project.riskFlags);
    addWrappedText('Notes', project.notes);

    checklistSections.forEach((section) => {
      ensureSpace(700);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(section.section, left, y);
      y += 18;
      doc.setFontSize(10);
      section.items.forEach((item) => {
        ensureSpace(740);
        doc.setFont('helvetica', 'normal');
        const mark = checks[item] ? '[x]' : '[ ]';
        const lines = doc.splitTextToSize(`${mark} ${item}`, right - left);
        doc.text(lines, left, y);
        y += lines.length * 14 + 4;
      });
      y += 8;
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i += 1) {
      doc.setPage(i);
      doc.setDrawColor(220);
      doc.line(left, 760, right, 760);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Morgan Sound Internal Use', left, 774);
      doc.text(`Page ${i} of ${pageCount}`, right - 52, 774);
    }

    const filename = `${(project.projectName || 'Morgan_ROM_Request').replace(/\s+/g, '_')}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="app-shell">
      <div className="page-wrap">
        <header className="hero-card">
          <div>
            <div className="hero-title-row">
              <ClipboardList size={28} />
              <h1>Morgan Sound ROM Request Builder</h1>
            </div>
            <p className="hero-copy">
              A lean first-phase Morgan Sound ROM intake form with required fields, checklist enforcement,
              approvals, and PDF export.
            </p>
          </div>
          <div className="hero-grid">
            <div className="mini-card">
              <strong>1. ROM Request</strong>
              <span>Capture the minimum client, site, budget, and objective details needed to open a ROM request.</span>
            </div>
            <div className="mini-card">
              <strong>2. Project Backup</strong>
              <span>Collect drawings, site-walk status, existing-system verification, and field notes before estimating starts.</span>
            </div>
            <div className="mini-card">
              <strong>3. Internal Review</strong>
              <span>Document reviewer ownership, risks, and signoffs so the handoff is crisp instead of cloudy.</span>
            </div>
          </div>
        </header>

        <section className="top-grid">
          <article className="card card-wide">
            <div className="section-heading">
              <FileText size={20} />
              <h2>Workflow Summary</h2>
            </div>
            <p className="muted">
              Use this form to gather the minimum intake information Sales should always capture before a ROM is issued.
              Required fields are enforced before PDF export.
            </p>
          </article>

          <aside className="card progress-card">
            <div className="section-heading">
              {riskStatus.label === 'Green' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
              <h2>Progress & Risk</h2>
            </div>
            <div className="progress-meta">
              <span>Checklist completion</span>
              <span>{completion.percent}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${completion.percent}%` }} />
            </div>
            <div className={riskStatus.toneClass}>
              <strong>Traffic-light status: {riskStatus.label}</strong>
              <span>{riskStatus.description}</span>
            </div>
            <div className="info-card">
              <strong>Missing required fields</strong>
              <span>
                {missingRequired.length ? missingRequired.map(([label]) => label).join(', ') : 'None'}
              </span>
            </div>
            <button className="primary-button" onClick={exportPDF}>
              <Download size={16} />
              Export PDF
            </button>
          </aside>
        </section>

        <nav className="tabs">
          {[
            ['project', 'Project Info'],
            ['checklist', 'Checklist'],
            ['review', 'Review'],
            ['notes', 'Notes'],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`tab-button ${activeTab === key ? 'tab-active' : ''}`}
              onClick={() => setActiveTab(key as TabKey)}
            >
              {label}
            </button>
          ))}
        </nav>

        {activeTab === 'project' && (
          <section className="card">
            <div className="section-heading">
              <ClipboardList size={20} />
              <h2>Project Information</h2>
            </div>
            <div className="notice-card">
              Use this tab for intake details Sales should always capture before requesting a ROM. Fields marked with an asterisk are required for PDF export.
            </div>
            <div className="form-grid two-col">
              {renderInput('ROM Requested By', 'romRequestedBy', { required: true })}
              {renderInput('Project Name', 'projectName', { required: true })}
              {renderInput('Client / End User', 'client', { required: true })}
              {renderInput('Site Address', 'siteAddress', { required: true })}
              {renderInput('Sales Rep', 'salesRep', { required: true })}
              {renderInput('Primary Contact Name', 'contactName', { required: true })}
              {renderInput('Primary Contact Email', 'contactEmail')}
              {renderInput('Primary Contact Phone', 'contactPhone')}
              {renderInput('ROM Due Date', 'romDueDate', { required: true })}
              {renderInput('Target Budget Range', 'targetBudgetRange', { required: true })}
              {renderInput('Client Objective', 'clientObjective', { required: true })}
              {renderInput('Project Walk Completed / Status', 'projectWalkStatus')}
              {renderInput('Drawings Received', 'drawingsReceived')}
              {renderInput('Existing System Verified', 'existingSystemVerified')}
              {renderInput('Permit / Code Review Needed', 'permitCodeReview')}
              <div className="span-2">{renderInput('Scope Summary', 'summary', { textarea: true })}</div>
            </div>
          </section>
        )}

        {activeTab === 'checklist' && (
          <section className="card">
            <div className="notice-card">
              This checklist is the guardrail for a usable ROM request. It uses Morgan Sound phrasing so Sales, estimating, and operations can read the same sheet without a translation key.
            </div>
            <div className="checklist-grid">
              {checklistSections.map((section) => (
                <article key={section.section} className="checklist-card">
                  <div className="section-heading">
                    <ShieldCheck size={18} />
                    <h3>{section.section}</h3>
                  </div>
                  <div className="checklist-items">
                    {section.items.map((item) => (
                      <label className="check-item" key={item}>
                        <input type="checkbox" checked={checks[item]} onChange={() => toggleCheck(item)} />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'review' && (
          <section className="card">
            <div className={riskStatus.toneClass}>
              <strong>Current ROM status: {riskStatus.label}</strong>
              <span>{riskStatus.description}</span>
            </div>
            <div className="notice-card">
              Use this section to prepare the handoff. The customer-facing summary should read like a clean executive snapshot, while risk flags should capture lead time, access, unknown conditions, permitting, labor assumptions, or scope gaps.
            </div>
            <div className="form-grid two-col">
              {renderInput('Internal Reviewer', 'reviewer')}
              {renderInput('Document Number', 'documentNumber')}
              <div className="span-2">{renderInput('Customer-Facing Summary', 'customerSummary', { textarea: true })}</div>
              <div className="span-2">{renderInput('Risk Flags / Lead-Time Concerns', 'riskFlags', { textarea: true })}</div>
              {renderInput('Sales Approval Name', 'salesApprovalName')}
              {renderInput('Sales Approval Date', 'salesApprovalDate')}
              {renderInput('Estimating Approval Name', 'estimatingApprovalName')}
              {renderInput('Estimating Approval Date', 'estimatingApprovalDate')}
            </div>
          </section>
        )}

        {activeTab === 'notes' && (
          <section className="card">
            <div className="notice-card">
              Use assumptions to document what the ROM is based on. Use exclusions to clearly state what is not included. This keeps the estimate from turning into a fog machine later.
            </div>
            <div className="form-grid one-col">
              {renderInput('Assumptions', 'assumptions', { required: true, textarea: true })}
              {renderInput('Exclusions', 'exclusions', { required: true, textarea: true })}
              {renderInput('Additional Notes', 'notes', { textarea: true })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
