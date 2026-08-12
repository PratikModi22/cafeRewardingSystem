import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import type { Customer, WhatsAppTemplate, CustomerList, WhatsAppCampaign, WhatsAppCampaignLog } from '../types';
import {
  MessageSquare,
  Send,
  Plus,
  Trash2,
  Play,
  FileText,
  AlertTriangle,
  Loader2,
  Info,
  X,
  UserPlus,
  ExternalLink
} from 'lucide-react';

export const Marketing: React.FC = () => {
  const { cafe } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'lists'>('campaigns');

  // DB Fallback state
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [dbChecking, setDbChecking] = useState(true);

  // Data States
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [lists, setLists] = useState<CustomerList[]>([]);
  const [loading, setLoading] = useState(true);

  // Templates Management States
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempBody, setTempBody] = useState('');
  const [tempMetaName, setTempMetaName] = useState('');
  const [tempMetaLang, setTempMetaLang] = useState('en_US');
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Audience Lists Management States
  const [showListModal, setShowListModal] = useState(false);
  const [listName, setListName] = useState('');
  const [listDesc, setListDesc] = useState('');
  const [selectedCustIds, setSelectedCustIds] = useState<string[]>([]);
  const [editingList, setEditingList] = useState<CustomerList | null>(null);

  // Campaign Wizard States
  const [showWizard, setShowWizard] = useState(false);
  const [campName, setCampName] = useState('');
  const [campTemplateId, setCampTemplateId] = useState('');
  const [campListId, setCampListId] = useState(''); // empty string means "All Customers"
  
  // Campaign Running States
  const [isWizardRunning, setIsWizardRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(0);
  const [runLogs, setRunLogs] = useState<string[]>([]);
  const [runStats, setRunStats] = useState({ sent: 0, failed: 0, total: 0 });

  // Detail Modal States
  const [selectedCampaign, setSelectedCampaign] = useState<WhatsAppCampaign | null>(null);
  const [campaignLogs, setCampaignLogs] = useState<WhatsAppCampaignLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Mock sample customer for live preview
  const mockCustomer = {
    name: 'Pratik Modi',
    phone: '+91 98765 43210',
    email: 'pratik@example.com',
    total_visits: 8,
    current_progress: 8,
    reward_count: 2,
    lifetime_spending: 2450
  };

  useEffect(() => {
    if (cafe) {
      checkDatabaseAndFetch();
    }
  }, [cafe]);

  // Check if tables exist and load data
  const checkDatabaseAndFetch = async () => {
    if (!cafe) return;
    setDbChecking(true);
    try {
      // Fetch customers first (standard schema)
      const { data: custs } = await supabase
        .from('customers')
        .select('*')
        .eq('cafe_id', cafe.id);
      setCustomers(custs || []);

      // Probe templates table to see if migrated
      const { error } = await supabase
        .from('whatsapp_templates')
        .select('id')
        .limit(1);

      if (error) {
        console.warn('WhatsApp tables might not be migrated, falling back to LocalStorage:', error.message);
        setIsFallbackMode(true);
        loadFromLocalStorage(custs || []);
      } else {
        setIsFallbackMode(false);
        await fetchAllSupabaseData();
      }
    } catch (err) {
      console.error('Error probing DB schema:', err);
      setIsFallbackMode(true);
      loadFromLocalStorage([]);
    } finally {
      setDbChecking(false);
      setLoading(false);
    }
  };

  // Fetch all Supabase data if tables are migrated
  const fetchAllSupabaseData = async () => {
    if (!cafe) return;
    setLoading(true);
    try {
      // 1. Fetch Templates
      const { data: tmps } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('cafe_id', cafe.id)
        .order('created_at', { ascending: false });
      setTemplates(tmps || []);

      // 2. Fetch Lists
      const { data: lsts } = await supabase
        .from('customer_lists')
        .select('*')
        .eq('cafe_id', cafe.id)
        .order('created_at', { ascending: false });
      
      // Load member counts for each list
      const resolvedLsts = await Promise.all((lsts || []).map(async (l) => {
        const { count } = await supabase
          .from('customer_list_members')
          .select('customer_id', { count: 'exact', head: true })
          .eq('list_id', l.id);
        return { ...l, member_count: count || 0 };
      }));
      setLists(resolvedLsts);

      // 3. Fetch Campaigns
      const { data: camps } = await supabase
        .from('whatsapp_campaigns')
        .select('*')
        .eq('cafe_id', cafe.id)
        .order('created_at', { ascending: false });
      
      // Inject Template & List Names
      const resolvedCamps = (camps || []).map(c => {
        const t = tmps?.find(tmp => tmp.id === c.template_id);
        const l = lsts?.find(lst => lst.id === c.list_id);
        return {
          ...c,
          template_name: t ? t.name : 'Unknown Template',
          list_name: c.list_id ? (l ? l.name : 'Deleted List') : 'All Customers'
        };
      });
      setCampaigns(resolvedCamps);
    } catch (err) {
      console.error('Error fetching Supabase data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fallback storage loader
  const loadFromLocalStorage = (custs: Customer[]) => {
    if (!cafe) return;
    const cafeId = cafe.id;
    
    // Templates
    const savedTemplates = localStorage.getItem(`wa_templates_${cafeId}`);
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    } else {
      // Seed default template
      const defaultT: WhatsAppTemplate = {
        id: 'seed-temp-1',
        cafe_id: cafeId,
        name: 'Welcome Progress Update',
        body: 'Hi {list.name}! Welcome to {cafe_name}. You have completed {current_progress} checkins out of {reward_threshold} for your next {reward_name}!',
        meta_template_name: 'welcome_progress',
        meta_language_code: 'en_US',
        created_at: new Date().toISOString()
      };
      setTemplates([defaultT]);
      localStorage.setItem(`wa_templates_${cafeId}`, JSON.stringify([defaultT]));
    }

    // Lists
    const savedLists = localStorage.getItem(`wa_lists_${cafeId}`);
    const savedMembers = localStorage.getItem(`wa_list_members_${cafeId}`);
    if (savedLists && savedMembers) {
      const parsedLists = JSON.parse(savedLists);
      const parsedMembers = JSON.parse(savedMembers);
      
      const resolved = parsedLists.map((l: any) => {
        const count = parsedMembers.filter((m: any) => m.list_id === l.id).length;
        return { ...l, member_count: count };
      });
      setLists(resolved);
    } else {
      // Seed default list (first 3 customers)
      const listId = 'seed-list-1';
      const defaultL = {
        id: listId,
        cafe_id: cafeId,
        name: 'VVIP Customers',
        description: 'Loyal customers with high activity',
        created_at: new Date().toISOString()
      };
      const defaultMembers = (custs || []).slice(0, 3).map(c => ({
        list_id: listId,
        customer_id: c.id
      }));

      setLists([{ ...defaultL, member_count: defaultMembers.length }]);
      localStorage.setItem(`wa_lists_${cafeId}`, JSON.stringify([defaultL]));
      localStorage.setItem(`wa_list_members_${cafeId}`, JSON.stringify(defaultMembers));
    }

    // Campaigns
    const savedCamps = localStorage.getItem(`wa_campaigns_${cafeId}`);
    if (savedCamps) {
      setCampaigns(JSON.parse(savedCamps));
    } else {
      setCampaigns([]);
    }
  };

  // Helper variables for interpolation
  const interpolateTemplate = (body: string, customer: any) => {
    if (!cafe) return body;
    return body
      .replace(/\{name\}/g, customer.name)
      .replace(/\{list\.name\}/g, customer.name)
      .replace(/\{customer\.name\}/g, customer.name)
      .replace(/\{phone\}/g, customer.phone)
      .replace(/\{email\}/g, customer.email || '')
      .replace(/\{total_visits\}/g, String(customer.total_visits))
      .replace(/\{current_progress\}/g, String(customer.current_progress))
      .replace(/\{reward_count\}/g, String(customer.reward_count))
      .replace(/\{reward_name\}/g, cafe.reward_name)
      .replace(/\{reward_threshold\}/g, String(cafe.reward_threshold))
      .replace(/\{cafe_name\}/g, cafe.name);
  };

  // Click tag helper inside text area
  const handleInsertTag = (tag: string) => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = tempBody;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    setTempBody(before + tag + after);
    
    // Reset focus and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + tag.length;
    }, 50);
  };

  // -------------------------------------------------------------
  // TEMPLATES CRUD
  // -------------------------------------------------------------
  const handleOpenTemplateModal = (t: WhatsAppTemplate | null) => {
    setEditingTemplate(t);
    if (t) {
      setTempName(t.name);
      setTempBody(t.body);
      setTempMetaName(t.meta_template_name || '');
      setTempMetaLang(t.meta_language_code || 'en_US');
    } else {
      setTempName('');
      setTempBody('');
      setTempMetaName('');
      setTempMetaLang('en_US');
    }
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafe) return;
    
    const templateData = {
      cafe_id: cafe.id,
      name: tempName,
      body: tempBody,
      meta_template_name: tempMetaName || null,
      meta_language_code: tempMetaLang || 'en_US',
    };

    if (isFallbackMode) {
      const cafeId = cafe.id;
      const current = localStorage.getItem(`wa_templates_${cafeId}`);
      let parsed = current ? JSON.parse(current) : [];
      
      if (editingTemplate) {
        // Edit
        parsed = parsed.map((t: any) => t.id === editingTemplate.id ? { ...t, ...templateData } : t);
      } else {
        // Add
        parsed.unshift({
          id: `temp-${Date.now()}`,
          created_at: new Date().toISOString(),
          ...templateData
        });
      }
      localStorage.setItem(`wa_templates_${cafeId}`, JSON.stringify(parsed));
      setTemplates(parsed);
      setShowTemplateModal(false);
    } else {
      try {
        if (editingTemplate) {
          const { error } = await supabase
            .from('whatsapp_templates')
            .update(templateData)
            .eq('id', editingTemplate.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('whatsapp_templates')
            .insert(templateData);
          if (error) throw error;
        }
        await fetchAllSupabaseData();
        setShowTemplateModal(false);
      } catch (err) {
        console.error('Error saving template:', err);
        alert('Failed to save template to database.');
      }
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    if (!cafe) return;

    if (isFallbackMode) {
      const cafeId = cafe.id;
      const current = localStorage.getItem(`wa_templates_${cafeId}`);
      if (current) {
        const filtered = JSON.parse(current).filter((t: any) => t.id !== id);
        localStorage.setItem(`wa_templates_${cafeId}`, JSON.stringify(filtered));
        setTemplates(filtered);
      }
    } else {
      try {
        const { error } = await supabase
          .from('whatsapp_templates')
          .delete()
          .eq('id', id);
        if (error) throw error;
        await fetchAllSupabaseData();
      } catch (err) {
        console.error('Error deleting template:', err);
        alert('Failed to delete template.');
      }
    }
  };

  // -------------------------------------------------------------
  // LISTS CRUD
  // -------------------------------------------------------------
  const handleOpenListModal = (l: CustomerList | null) => {
    setEditingList(l);
    if (l) {
      setListName(l.name);
      setListDesc(l.description || '');
      
      // Load current members of this list
      if (isFallbackMode) {
        const savedMembers = localStorage.getItem(`wa_list_members_${cafe?.id}`);
        const parsed = savedMembers ? JSON.parse(savedMembers) : [];
        const memberIds = parsed.filter((m: any) => m.list_id === l.id).map((m: any) => m.customer_id);
        setSelectedCustIds(memberIds);
      } else {
        loadListMembersDB(l.id);
      }
    } else {
      setListName('');
      setListDesc('');
      setSelectedCustIds([]);
    }
    setShowListModal(true);
  };

  const loadListMembersDB = async (listId: string) => {
    try {
      const { data } = await supabase
        .from('customer_list_members')
        .select('customer_id')
        .eq('list_id', listId);
      setSelectedCustIds((data || []).map(m => m.customer_id));
    } catch (err) {
      console.error('Error loading list members:', err);
    }
  };

  const toggleCustomerSelection = (cid: string) => {
    if (selectedCustIds.includes(cid)) {
      setSelectedCustIds(selectedCustIds.filter(id => id !== cid));
    } else {
      setSelectedCustIds([...selectedCustIds, cid]);
    }
  };

  const handleSaveList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafe) return;
    const cafeId = cafe.id;

    const listData = {
      cafe_id: cafeId,
      name: listName,
      description: listDesc || null
    };

    if (isFallbackMode) {
      // Save List
      const savedLists = localStorage.getItem(`wa_lists_${cafeId}`);
      let parsedLists = savedLists ? JSON.parse(savedLists) : [];
      let activeListId = editingList?.id || `list-${Date.now()}`;

      if (editingList) {
        parsedLists = parsedLists.map((l: any) => l.id === editingList.id ? { ...l, ...listData } : l);
      } else {
        parsedLists.unshift({
          id: activeListId,
          created_at: new Date().toISOString(),
          ...listData
        });
      }
      localStorage.setItem(`wa_lists_${cafeId}`, JSON.stringify(parsedLists));

      // Save List Members
      const savedMembers = localStorage.getItem(`wa_list_members_${cafeId}`);
      let parsedMembers = savedMembers ? JSON.parse(savedMembers) : [];
      // Clear old member mappings for this list
      parsedMembers = parsedMembers.filter((m: any) => m.list_id !== activeListId);
      // Add new member mappings
      selectedCustIds.forEach(cid => {
        parsedMembers.push({
          list_id: activeListId,
          customer_id: cid
        });
      });
      localStorage.setItem(`wa_list_members_${cafeId}`, JSON.stringify(parsedMembers));
      
      // Reload UI state
      loadFromLocalStorage(customers);
      setShowListModal(false);
    } else {
      try {
        let activeListId = '';
        if (editingList) {
          activeListId = editingList.id;
          const { error } = await supabase
            .from('customer_lists')
            .update(listData)
            .eq('id', activeListId);
          if (error) throw error;

          // Delete all current member rows to override
          await supabase
            .from('customer_list_members')
            .delete()
            .eq('list_id', activeListId);
        } else {
          const { data, error } = await supabase
            .from('customer_lists')
            .insert(listData)
            .select()
            .single();
          if (error) throw error;
          activeListId = data.id;
        }

        // Insert new member rows
        if (selectedCustIds.length > 0) {
          const rows = selectedCustIds.map(cid => ({
            list_id: activeListId,
            customer_id: cid
          }));
          const { error } = await supabase
            .from('customer_list_members')
            .insert(rows);
          if (error) throw error;
        }

        await fetchAllSupabaseData();
        setShowListModal(false);
      } catch (err) {
        console.error('Error saving list to DB:', err);
        alert('Failed to save list.');
      }
    }
  };

  const handleDeleteList = async (id: string) => {
    if (!confirm('Are you sure you want to delete this list?')) return;
    if (!cafe) return;
    const cafeId = cafe.id;

    if (isFallbackMode) {
      // Remove list
      const savedLists = localStorage.getItem(`wa_lists_${cafeId}`);
      if (savedLists) {
        const filtered = JSON.parse(savedLists).filter((l: any) => l.id !== id);
        localStorage.setItem(`wa_lists_${cafeId}`, JSON.stringify(filtered));
      }
      // Remove members mapping
      const savedMembers = localStorage.getItem(`wa_list_members_${cafeId}`);
      if (savedMembers) {
        const filtered = JSON.parse(savedMembers).filter((m: any) => m.list_id !== id);
        localStorage.setItem(`wa_list_members_${cafeId}`, JSON.stringify(filtered));
      }
      loadFromLocalStorage(customers);
    } else {
      try {
        const { error } = await supabase
          .from('customer_lists')
          .delete()
          .eq('id', id);
        if (error) throw error;
        await fetchAllSupabaseData();
      } catch (err) {
        console.error('Error deleting list:', err);
        alert('Failed to delete list.');
      }
    }
  };

  // -------------------------------------------------------------
  // CAMPAIGNS EXECUTION & WIZARD
  // -------------------------------------------------------------
  const handleOpenWizard = () => {
    setCampName('');
    setCampTemplateId(templates[0]?.id || '');
    setCampListId(''); // Default: all customers
    setIsWizardRunning(false);
    setShowWizard(true);
  };

  // Extract variables inside brackets, e.g. '{name}' -> 'name'
  const extractVariablesInOrder = (body: string): string[] => {
    const matches = body.match(/\{[a-zA-Z._0-9]+}/g);
    return matches ? matches.map(m => m.trim()) : [];
  };

  const resolveTokenValue = (token: string, customer: any): string => {
    if (!cafe) return '';
    const lower = token.toLowerCase();
    if (lower.includes('name')) return customer.name;
    if (lower.includes('phone')) return customer.phone;
    if (lower.includes('email')) return customer.email || '';
    if (lower.includes('current_progress')) return String(customer.current_progress);
    if (lower.includes('total_visits')) return String(customer.total_visits);
    if (lower.includes('reward_count')) return String(customer.reward_count);
    if (lower.includes('reward_name')) return cafe.reward_name;
    if (lower.includes('reward_threshold')) return String(cafe.reward_threshold);
    if (lower.includes('cafe_name')) return cafe.name;
    return '';
  };

  // The actual campaign loop
  const handleRunCampaign = async () => {
    if (!cafe) return;
    const selectedTemplate = templates.find(t => t.id === campTemplateId);
    if (!selectedTemplate) {
      alert('Please select a template');
      return;
    }

    // Determine target customer audience
    let targets: Customer[] = [];
    if (campListId === '') {
      targets = customers;
    } else {
      if (isFallbackMode) {
        const savedMembers = localStorage.getItem(`wa_list_members_${cafe.id}`);
        const parsed = savedMembers ? JSON.parse(savedMembers) : [];
        const customerIdsInList = parsed.filter((m: any) => m.list_id === campListId).map((m: any) => m.customer_id);
        targets = customers.filter(c => customerIdsInList.includes(c.id));
      } else {
        try {
          const { data } = await supabase
            .from('customer_list_members')
            .select('customer_id')
            .eq('list_id', campListId);
          const ids = (data || []).map(m => m.customer_id);
          targets = customers.filter(c => ids.includes(c.id));
        } catch (err) {
          console.error(err);
          alert('Failed to fetch list members');
          return;
        }
      }
    }

    if (targets.length === 0) {
      alert('The selected audience list contains 0 customers. Add customers to list first.');
      return;
    }

    setIsWizardRunning(true);
    setRunProgress(0);
    setRunLogs(['Starting campaign dispatch...', `Target audience: ${targets.length} recipients.`]);
    setRunStats({ sent: 0, failed: 0, total: targets.length });

    // Meta API keys check
    const hasKeys = !!(cafe.whatsapp_access_token && cafe.whatsapp_phone_number_id);
    if (!hasKeys) {
      setRunLogs(prev => [...prev, 'ℹ️ No Meta Cloud API credentials stored. Running in Simulation Sandbox Mode.']);
    } else {
      setRunLogs(prev => [...prev, '⚡ Authenticated credentials found. Dispatching to Meta Cloud API...']);
    }

    let campaignId = `camp-${Date.now()}`;
    const logsToSave: any[] = [];
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < targets.length; i++) {
      const recipient = targets[i];
      const interpolatedText = interpolateTemplate(selectedTemplate.body, recipient);
      
      // Meta Graph API parameters (in order)
      const tokenVariables = extractVariablesInOrder(selectedTemplate.body);
      const bodyParams = tokenVariables.map(tok => resolveTokenValue(tok, recipient));

      setRunLogs(prev => [...prev, `[${i + 1}/${targets.length}] Dispatching message to ${recipient.name} (${recipient.phone})...`]);

      let isSuccess = false;
      let errMsg: string | null = null;

      if (hasKeys) {
        // Meta Graph API call
        try {
          const cleanPhone = recipient.phone.replace(/[\s+]/g, '');
          const isTemplateMode = !!selectedTemplate.meta_template_name;

          let response;
          if (isTemplateMode) {
            // Template payload
            response = await fetch(`https://graph.facebook.com/v19.0/${cafe.whatsapp_phone_number_id}/messages`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${cafe.whatsapp_access_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: cleanPhone,
                type: 'template',
                template: {
                  name: selectedTemplate.meta_template_name,
                  language: { code: selectedTemplate.meta_language_code || 'en_US' },
                  components: bodyParams.length > 0 ? [{
                    type: 'body',
                    parameters: bodyParams.map(val => ({ type: 'text', text: val }))
                  }] : []
                }
              })
            });
          } else {
            // Standard session text payload
            response = await fetch(`https://graph.facebook.com/v19.0/${cafe.whatsapp_phone_number_id}/messages`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${cafe.whatsapp_access_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: cleanPhone,
                type: 'text',
                text: { preview_url: false, body: interpolatedText }
              })
            });
          }

          if (response.ok) {
            isSuccess = true;
            setRunLogs(prev => [...prev, `   ✅ Success: Delivered message (Meta Transaction ID generated).`]);
          } else {
            const errData = await response.json();
            throw new Error(errData?.error?.message || `HTTP Status ${response.status}`);
          }
        } catch (err: any) {
          isSuccess = false;
          errMsg = err.message || 'API connection failed';
          setRunLogs(prev => [...prev, `   ❌ Error: ${errMsg}`]);
        }
      } else {
        // Simulation Sandbox Mode (Delay 500ms for authentic UI feel)
        await new Promise(resolve => setTimeout(resolve, 600));
        isSuccess = true; // Simulator always succeeds unless phone is empty
        if (!recipient.phone || recipient.phone.length < 5) {
          isSuccess = false;
          errMsg = 'Missing or invalid phone number';
          setRunLogs(prev => [...prev, `   ❌ Error: ${errMsg}`]);
        } else {
          setRunLogs(prev => [...prev, `   ✅ Success (Simulated): Message matched template fields.`]);
        }
      }

      if (isSuccess) {
        sentCount++;
      } else {
        failedCount++;
      }

      // Collect Log
      logsToSave.push({
        id: `log-${Date.now()}-${i}`,
        campaign_id: campaignId,
        customer_name: recipient.name,
        customer_phone: recipient.phone,
        status: isSuccess ? 'sent' : 'failed',
        error_message: errMsg,
        created_at: new Date().toISOString()
      });

      // Update progress states
      setRunStats({ sent: sentCount, failed: failedCount, total: targets.length });
      setRunProgress(Math.round(((i + 1) / targets.length) * 100));
    }

    setRunLogs(prev => [...prev, '🎉 Marketing Campaign execution completed.']);

    // Persist campaign and logs
    const newCampaign: WhatsAppCampaign = {
      id: campaignId,
      cafe_id: cafe.id,
      template_id: campTemplateId,
      list_id: campListId === '' ? null : campListId,
      name: campName || `Campaign ${new Date().toLocaleDateString()}`,
      status: failedCount === 0 ? 'sent' : 'failed',
      sent_count: targets.length,
      delivered_count: sentCount,
      failed_count: failedCount,
      created_at: new Date().toISOString(),
      template_name: selectedTemplate.name,
      list_name: campListId === '' ? 'All Customers' : (lists.find(l => l.id === campListId)?.name || 'Audience List')
    };

    if (isFallbackMode) {
      // Save campaign
      const oldCamps = localStorage.getItem(`wa_campaigns_${cafe.id}`);
      const parsedCamps = oldCamps ? JSON.parse(oldCamps) : [];
      parsedCamps.unshift(newCampaign);
      localStorage.setItem(`wa_campaigns_${cafe.id}`, JSON.stringify(parsedCamps));
      setCampaigns(parsedCamps);

      // Save campaign logs
      const oldLogs = localStorage.getItem(`wa_campaign_logs_${cafe.id}`);
      const parsedLogs = oldLogs ? JSON.parse(oldLogs) : [];
      localStorage.setItem(`wa_campaign_logs_${cafe.id}`, JSON.stringify([...logsToSave, ...parsedLogs]));
    } else {
      try {
        // Insert DB campaign
        const { data: dbCamp, error: campErr } = await supabase
          .from('whatsapp_campaigns')
          .insert({
            id: newCampaign.id,
            cafe_id: newCampaign.cafe_id,
            template_id: newCampaign.template_id,
            list_id: newCampaign.list_id,
            name: newCampaign.name,
            status: newCampaign.status,
            sent_count: newCampaign.sent_count,
            delivered_count: newCampaign.delivered_count,
            failed_count: newCampaign.failed_count
          })
          .select()
          .single();
        
        if (campErr) throw campErr;

        // Insert DB campaign logs
        const dbLogs = logsToSave.map(l => ({
          campaign_id: dbCamp.id,
          customer_name: l.customer_name,
          customer_phone: l.customer_phone,
          status: l.status,
          error_message: l.error_message
        }));

        const { error: logsErr } = await supabase
          .from('whatsapp_campaign_logs')
          .insert(dbLogs);
        if (logsErr) throw logsErr;

        await fetchAllSupabaseData();
      } catch (err) {
        console.error('Error saving campaign results to Supabase:', err);
      }
    }

    // Finished
    setIsWizardRunning(false);
  };

  // -------------------------------------------------------------
  // CAMPAIGN DETAILS / AUDIT LOG DRAWER
  // -------------------------------------------------------------
  const handleOpenCampaignDetails = async (c: WhatsAppCampaign) => {
    setSelectedCampaign(c);
    setLoadingLogs(true);
    if (isFallbackMode) {
      const savedLogs = localStorage.getItem(`wa_campaign_logs_${cafe?.id}`);
      const parsed = savedLogs ? JSON.parse(savedLogs) : [];
      const filtered = parsed.filter((l: any) => l.campaign_id === c.id);
      setCampaignLogs(filtered);
      setLoadingLogs(false);
    } else {
      try {
        const { data, error } = await supabase
          .from('whatsapp_campaign_logs')
          .select('*')
          .eq('campaign_id', c.id);
        if (error) throw error;
        setCampaignLogs(data || []);
      } catch (err) {
        console.error('Error fetching campaign logs:', err);
      } finally {
        setLoadingLogs(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Fallback Sandbox Alert */}
      {isFallbackMode && !dbChecking && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold">Sandbox Mode Activated:</span> WhatsApp database tables aren't found in your Supabase schema. We've automatically loaded an interactive local storage simulation.
            </div>
          </div>
          <a
            href="file:///d:/Cafe%20Rewarding%20System/whatsapp_marketing_tables.sql"
            className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-xl transition-all duration-200 decoration-none cursor-pointer font-bold whitespace-nowrap"
            target="_blank"
            rel="noreferrer"
          >
            Open SQL Script
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Meta API Keys Status Header */}
      {cafe && !cafe.whatsapp_access_token && (
        <div className="bg-brand-500/10 border border-brand-500/20 text-brand-300 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
          <Info className="w-5 h-5 shrink-0 text-brand-400" />
          <div>
            WhatsApp integration is in Simulation Mode. Add your <span className="text-white underline">Meta Access Token</span> and <span className="text-white underline">Phone Number ID</span> in the Settings tab to run live messaging.
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight m-0">WhatsApp Marketing</h2>
          <p className="text-xs text-slate-400 mt-1">Settle messaging templates, build audience segments, and run custom outreach.</p>
        </div>
        <button
          onClick={handleOpenWizard}
          className="bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-md text-xs"
        >
          <Play className="w-4 h-4 text-white" />
          Launch Campaign
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 bg-[#0f172a] border border-[#1e293b] p-1 rounded-2xl max-w-sm">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'campaigns'
              ? 'bg-brand-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Campaigns
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'templates'
              ? 'bg-brand-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Templates
        </button>
        <button
          onClick={() => setActiveTab('lists')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'lists'
              ? 'bg-brand-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Audience Lists
        </button>
      </div>

      {/* Main Tab Content */}
      {loading ? (
        <div className="py-24 flex items-center justify-center bg-[#0f172a] border border-[#1e293b] rounded-3xl">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
        </div>
      ) : (
        <>
          {/* TAB 1: CAMPAIGNS */}
          {activeTab === 'campaigns' && (
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl overflow-hidden shadow-sm">
              {campaigns.length === 0 ? (
                <div className="py-24 text-center">
                  <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium">No marketing campaigns run yet.</p>
                  <p className="text-xs text-slate-500 mt-1">Get started by launching a new outreach campaign.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1e293b] bg-[#1e293b]/20 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        <th className="py-4 px-6">Campaign Name</th>
                        <th className="py-4 px-6">Message Template</th>
                        <th className="py-4 px-6">Audience Group</th>
                        <th className="py-4 px-6">Sent Size</th>
                        <th className="py-4 px-6">Success Rate</th>
                        <th className="py-4 px-6 text-right">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b] text-sm font-medium">
                      {campaigns.map((c) => {
                        const total = c.sent_count;
                        const success = c.delivered_count;
                        const rate = total > 0 ? Math.round((success / total) * 100) : 0;
                        return (
                          <tr
                            key={c.id}
                            onClick={() => handleOpenCampaignDetails(c)}
                            className="hover:bg-[#1e293b]/20 cursor-pointer transition-colors duration-150"
                          >
                            <td className="py-4 px-6 text-white flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${c.failed_count > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                              {c.name}
                            </td>
                            <td className="py-4 px-6 text-slate-300">{c.template_name}</td>
                            <td className="py-4 px-6 text-slate-300">
                              <span className="bg-[#1e293b] px-2.5 py-1 rounded-xl text-xs text-slate-400 border border-[#334155]/30">
                                {c.list_name}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-300">{total}</td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-[#1e293b] h-1.5 rounded-full overflow-hidden border border-[#334155]/30">
                                  <div
                                    className={`h-full ${c.failed_count > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${rate}%` }}
                                  />
                                </div>
                                <span className={`text-xs font-bold ${c.failed_count > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                  {rate}% ({success}/{total})
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-slate-400 text-right text-xs">
                              {new Date(c.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Template List (7 cols) */}
              <div className="lg:col-span-7 bg-[#0f172a] border border-[#1e293b] rounded-3xl overflow-hidden p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight m-0">Stored Message Templates</h3>
                    <p className="text-[11px] text-slate-400 mt-1">Reusable marketing messages containing variable tokens.</p>
                  </div>
                  <button
                    onClick={() => handleOpenTemplateModal(null)}
                    className="bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-white font-semibold py-1.5 px-3 rounded-xl transition-all duration-200 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-brand-400" />
                    New Template
                  </button>
                </div>

                <div className="space-y-3">
                  {templates.map(t => (
                    <div
                      key={t.id}
                      className="border border-[#1e293b] bg-[#1e293b]/20 p-4 rounded-2xl flex items-start justify-between gap-4 hover:border-[#334155] transition-all duration-150"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white m-0">{t.name}</h4>
                          {t.meta_template_name && (
                            <span className="text-[9px] bg-brand-500/10 border border-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full font-bold">
                              Meta: {t.meta_template_name}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 font-mono line-clamp-3 mt-1 bg-[#0b0f19]/30 p-2.5 rounded-xl border border-[#1e293b]/50 select-all">
                          {t.body}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenTemplateModal(t)}
                          className="w-8 h-8 rounded-lg bg-[#1e293b] hover:bg-[#334155] border border-[#334155] flex items-center justify-center text-slate-400 hover:text-white transition-all duration-150 cursor-pointer"
                          title="Edit Template"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(t.id)}
                          className="w-8 h-8 rounded-lg bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/30 flex items-center justify-center text-rose-400 hover:text-rose-300 transition-all duration-150 cursor-pointer"
                          title="Delete Template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mockup Preview (5 cols) */}
              <div className="lg:col-span-5 bg-[#0f172a] border border-[#1e293b] p-6 rounded-3xl space-y-6 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight m-0">Live WhatsApp Preview</h3>
                  <p className="text-[11px] text-slate-400 mt-1">CSS simulated mockup displaying actual template formatting.</p>
                </div>

                {/* Smartphone Shell Mockup */}
                <div className="relative mx-auto max-w-[280px] border-4 border-[#1e293b] rounded-[36px] bg-[#070a0f] p-3 shadow-xl overflow-hidden">
                  {/* Speaker slot */}
                  <div className="w-20 h-4 bg-[#1e293b] rounded-full mx-auto mb-2" />

                  {/* Screen Content */}
                  <div className="h-96 rounded-2xl bg-[#080d16] flex flex-col justify-between overflow-hidden border border-[#1e293b]">
                    {/* Header */}
                    <div className="bg-[#1f2c34] p-3 flex items-center gap-2 border-b border-[#2a3942]/50 shrink-0">
                      <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {cafe?.name ? cafe.name.substring(0, 2).toUpperCase() : 'CF'}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-bold text-white leading-none m-0 truncate">{cafe?.name || 'Cafe Rewards'}</p>
                        <span className="text-[8px] text-emerald-400 font-medium">online</span>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#0b141a]">
                      {templates[0] ? (
                        <div className="max-w-[85%] bg-[#005c4b] border border-[#005c4b]/50 rounded-2xl rounded-tl-none p-2.5 relative shadow-sm text-left">
                          <p className="text-[10px] text-slate-100 font-medium whitespace-pre-wrap leading-relaxed m-0">
                            {interpolateTemplate(templates[0].body, mockCustomer)}
                          </p>
                          <span className="block text-[7px] text-emerald-300 text-right mt-1 font-mono">16:00</span>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-[10px] text-slate-500 italic">No template created to display.</p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="bg-[#1f2c34] p-2 flex items-center gap-2 shrink-0 border-t border-[#2a3942]/50">
                      <div className="flex-1 bg-[#2a3942] rounded-full h-6 px-3 flex items-center">
                        <span className="text-[8px] text-slate-400">Message</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIENCE LISTS */}
          {activeTab === 'lists' && (
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight m-0">Audience Segments</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Group and target your customers for message campaigns.</p>
                </div>
                <button
                  onClick={() => handleOpenListModal(null)}
                  className="bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-white font-semibold py-1.5 px-3 rounded-xl transition-all duration-200 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-brand-400" />
                  New Audience List
                </button>
              </div>

              {/* Prebuilt Standard Segments card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-[#1e293b] bg-[#1e293b]/10 p-4 rounded-2xl flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] bg-brand-500/10 border border-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full font-bold">
                      Pre-built Segment
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1.5 mb-0">All Registered Customers</h4>
                    <p className="text-[11px] text-slate-400 m-0">Contains all customer records in the database.</p>
                  </div>
                  <span className="text-lg font-bold text-white shrink-0 bg-[#1e293b] px-3.5 py-1.5 rounded-2xl">
                    {customers.length}
                  </span>
                </div>

                <div className="border border-[#1e293b] bg-[#1e293b]/10 p-4 rounded-2xl flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                      Pre-built Segment
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1.5 mb-0">Eligible for Next Reward</h4>
                    <p className="text-[11px] text-slate-400 m-0">Customers whose milestone progress matches/exceeds loyalty threshold.</p>
                  </div>
                  <span className="text-lg font-bold text-white shrink-0 bg-[#1e293b] px-3.5 py-1.5 rounded-2xl">
                    {customers.filter(c => c.current_progress >= (cafe?.reward_threshold || 10)).length}
                  </span>
                </div>
              </div>

              {/* Custom list segments list */}
              {lists.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-[#1e293b]/50">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Custom Lists</h4>
                  <div className="space-y-3">
                    {lists.map(l => (
                      <div
                        key={l.id}
                        className="border border-[#1e293b] bg-[#1e293b]/20 p-4 rounded-2xl flex items-center justify-between gap-4 hover:border-[#334155] transition-all duration-150 font-medium"
                      >
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-white m-0">{l.name}</h4>
                          <p className="text-xs text-slate-400 m-0">{l.description || 'No description provided.'}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs bg-[#1e293b] text-slate-300 px-3 py-1 rounded-xl border border-[#334155]/30">
                            {l.member_count} members
                          </span>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleOpenListModal(l)}
                              className="w-8 h-8 rounded-lg bg-[#1e293b] hover:bg-[#334155] border border-[#334155] flex items-center justify-center text-slate-400 hover:text-white transition-all duration-150 cursor-pointer"
                              title="Edit List"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteList(l.id)}
                              className="w-8 h-8 rounded-lg bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/30 flex items-center justify-center text-rose-400 hover:text-rose-300 transition-all duration-150 cursor-pointer"
                              title="Delete List"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* -------------------------------------------------------------
          MODAL: TEMPLATE EDIT / CREATE
          ------------------------------------------------------------- */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#07090e]/80 backdrop-blur-sm" onClick={() => setShowTemplateModal(false)} />
          <div className="relative w-full max-w-2xl bg-[#0f172a] rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden flex flex-col text-left">
            <div className="p-6 border-b border-[#1e293b] flex items-center justify-between">
              <h3 className="text-base font-bold text-white m-0">
                {editingTemplate ? 'Edit Message Template' : 'Create Message Template'}
              </h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-[#1e293b] border border-transparent hover:border-[#334155] flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="p-6 space-y-5 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Template Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Template Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="Progress Milestones Promo"
                    className="w-full bg-[#1e293b]/60 text-white px-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500 font-medium"
                  />
                </div>

                {/* Optional Meta template Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    Meta Template Name
                    <span className="text-[10px] text-slate-500 font-medium capitalize">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={tempMetaName}
                    onChange={(e) => setTempMetaName(e.target.value)}
                    placeholder="welcome_back_coupon"
                    className="w-full bg-[#1e293b]/60 text-white px-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500 font-mono"
                  />
                </div>
              </div>

              {/* Message Body */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Message Body Content
                  </label>
                  <span className="text-[10px] text-slate-500 font-bold">Use tag variables below</span>
                </div>
                <textarea
                  ref={bodyTextareaRef}
                  required
                  rows={5}
                  value={tempBody}
                  onChange={(e) => setTempBody(e.target.value)}
                  placeholder="Hi {list.name}! You are currently at {current_progress} checkins. Complete {reward_threshold} visits for your free {reward_name}!"
                  className="w-full bg-[#1e293b]/60 text-white px-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500 font-mono"
                />

                {/* Variable Token Buttons */}
                <div className="bg-[#1e293b]/30 border border-[#1e293b] p-3 rounded-2xl space-y-2">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Insert Variables:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { tag: '{list.name}', desc: 'Customer Name' },
                      { tag: '{phone}', desc: 'Phone' },
                      { tag: '{current_progress}', desc: 'Loyalty Count' },
                      { tag: '{reward_threshold}', desc: 'Target Visits' },
                      { tag: '{reward_name}', desc: 'Reward Item' },
                      { tag: '{cafe_name}', desc: 'Cafe Name' }
                    ].map(t => (
                      <button
                        key={t.tag}
                        type="button"
                        onClick={() => handleInsertTag(t.tag)}
                        className="bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-xs text-slate-300 font-mono px-2.5 py-1 rounded-xl transition-all duration-150 cursor-pointer"
                        title={t.desc}
                      >
                        {t.tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="bg-[#1e293b] hover:bg-[#334155] text-slate-300 font-semibold py-2.5 px-4 rounded-xl transition-all duration-150 text-xs cursor-pointer border border-[#334155]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 px-5 rounded-xl transition-all duration-150 text-xs cursor-pointer shadow-md"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: AUDIENCE LIST EDIT / CREATE
          ------------------------------------------------------------- */}
      {showListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#07090e]/80 backdrop-blur-sm" onClick={() => setShowListModal(false)} />
          <div className="relative w-full max-w-2xl bg-[#0f172a] rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden flex flex-col text-left max-h-[85vh]">
            <div className="p-6 border-b border-[#1e293b] flex items-center justify-between shrink-0">
              <h3 className="text-base font-bold text-white m-0">
                {editingList ? 'Edit Audience Segment' : 'Create Audience Segment'}
              </h3>
              <button
                onClick={() => setShowListModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-[#1e293b] border border-transparent hover:border-[#334155] flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveList} className="flex-1 overflow-y-auto p-6 space-y-5 flex flex-col">
              {/* Form Input fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                {/* List Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Audience List Name
                  </label>
                  <input
                    type="text"
                    required
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    placeholder="Weekend regulars"
                    className="w-full bg-[#1e293b]/60 text-white px-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500 font-medium"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={listDesc}
                    onChange={(e) => setListDesc(e.target.value)}
                    placeholder="Customers targeted for coupon incentives"
                    className="w-full bg-[#1e293b]/60 text-white px-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500 font-medium"
                  />
                </div>
              </div>

              {/* Members Selection Table */}
              <div className="flex-1 overflow-hidden flex flex-col space-y-2.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
                  Select Recipient Customers ({selectedCustIds.length} chosen)
                </label>
                <div className="flex-1 border border-[#1e293b] rounded-2xl bg-[#0b0f19]/30 overflow-y-auto p-2">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1e293b] text-slate-400 uppercase font-semibold">
                        <th className="py-2.5 px-3 w-10">Select</th>
                        <th className="py-2.5 px-3">Customer Name</th>
                        <th className="py-2.5 px-3">Phone Number</th>
                        <th className="py-2.5 px-3">Visits</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b]/40 font-medium">
                      {customers.map(c => {
                        const checked = selectedCustIds.includes(c.id);
                        return (
                          <tr
                            key={c.id}
                            onClick={() => toggleCustomerSelection(c.id)}
                            className="hover:bg-[#1e293b]/30 cursor-pointer"
                          >
                            <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleCustomerSelection(c.id)}
                                className="w-4 h-4 rounded text-brand-500 bg-[#1e293b] border-[#334155] focus:ring-0 cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-white">{c.name}</td>
                            <td className="py-2.5 px-3 text-slate-400 font-mono">{c.phone}</td>
                            <td className="py-2.5 px-3 text-slate-300">{c.total_visits}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Buttons */}
              <div className="flex justify-end gap-3 pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowListModal(false)}
                  className="bg-[#1e293b] hover:bg-[#334155] text-slate-300 font-semibold py-2.5 px-4 rounded-xl transition-all duration-150 text-xs cursor-pointer border border-[#334155]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 px-5 rounded-xl transition-all duration-150 text-xs cursor-pointer shadow-md"
                >
                  Save Segment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: CAMPAIGN DISPATCH WIZARD
          ------------------------------------------------------------- */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#07090e]/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-[#0f172a] rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden flex flex-col text-left">
            <div className="p-6 border-b border-[#1e293b] flex items-center justify-between shrink-0">
              <h3 className="text-base font-bold text-white m-0">
                {isWizardRunning ? 'Campaign Dispatch Active' : 'Launch WhatsApp Campaign'}
              </h3>
              {!isWizardRunning && (
                <button
                  onClick={() => setShowWizard(false)}
                  className="w-8 h-8 rounded-lg hover:bg-[#1e293b] border border-transparent hover:border-[#334155] flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {isWizardRunning ? (
              /* ACTIVE EXECUTION DIALOG */
              <div className="p-6 space-y-6 flex flex-col">
                <div className="space-y-2 text-center">
                  <h4 className="text-sm font-semibold text-slate-300">Sending messages...</h4>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2.5 uppercase rounded-full text-brand-400 bg-brand-500/10 border border-brand-500/20 font-bold">
                          In Progress
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-white font-bold">
                          {runProgress}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2.5 mb-4 text-xs flex rounded bg-[#1e293b]">
                      <div
                        style={{ width: `${runProgress}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-brand-500 transition-all duration-300"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-[#1e293b]/40 rounded-xl p-3">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Processed</span>
                      <span className="text-base font-bold text-white mt-1 block">{runStats.sent + runStats.failed}</span>
                    </div>
                    <div className="bg-[#1e293b]/40 rounded-xl p-3">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Delivered</span>
                      <span className="text-base font-bold text-emerald-400 mt-1 block">{runStats.sent}</span>
                    </div>
                    <div className="bg-[#1e293b]/40 rounded-xl p-3">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Failed</span>
                      <span className="text-base font-bold text-rose-400 mt-1 block">{runStats.failed}</span>
                    </div>
                  </div>
                </div>

                {/* Real-time execution logs ticker */}
                <div className="space-y-1.5 flex-1 flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Dispatch Log:</span>
                  <div className="h-44 bg-[#0b0f19] border border-[#1e293b] p-3 rounded-2xl font-mono text-[10px] text-slate-300 overflow-y-auto space-y-1 select-text scrollbar-thin">
                    {runLogs.map((lg, index) => (
                      <p key={index} className="m-0 leading-relaxed break-all">
                        {lg}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* CONFIGURATION SETUP */
              <div className="p-6 space-y-5">
                {/* Campaign Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    required
                    value={campName}
                    onChange={(e) => setCampName(e.target.value)}
                    placeholder="Weekend Offer Blast"
                    className="w-full bg-[#1e293b]/60 text-white px-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500 font-medium"
                  />
                </div>

                {/* Template Choice */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Choose Template
                  </label>
                  <select
                    value={campTemplateId}
                    onChange={(e) => setCampTemplateId(e.target.value)}
                    className="w-full bg-[#1e293b] text-white px-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm font-medium"
                  >
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Audience Choice */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Select Audience Group
                  </label>
                  <select
                    value={campListId}
                    onChange={(e) => setCampListId(e.target.value)}
                    className="w-full bg-[#1e293b] text-white px-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm font-medium"
                  >
                    <option value="">All Registered Customers ({customers.length})</option>
                    {lists.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.member_count} members)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Submit Action */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowWizard(false)}
                    className="bg-[#1e293b] hover:bg-[#334155] text-slate-300 font-semibold py-2.5 px-4 rounded-xl transition-all duration-150 text-xs cursor-pointer border border-[#334155]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRunCampaign}
                    className="bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 px-5 rounded-xl transition-all duration-150 text-xs cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Start Campaign
                  </button>
                </div>
              </div>
            )}

            {/* Close / Done Button at the end of execution */}
            {!isWizardRunning && runProgress === 100 && (
              <div className="p-6 border-t border-[#1e293b] flex justify-end bg-[#1e293b]/10 shrink-0">
                <button
                  onClick={() => {
                    setShowWizard(false);
                    setRunProgress(0);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-xl text-xs cursor-pointer"
                >
                  Finished & Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          CAMPAIGN AUDIT DRAWER (SIDE MODAL)
          ------------------------------------------------------------- */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[#07090e]/80 backdrop-blur-sm" onClick={() => setSelectedCampaign(null)} />

          {/* Drawer Container */}
          <div className="relative w-full max-w-lg bg-[#0f172a] h-full shadow-2xl border-l border-[#1e293b] flex flex-col animate-slideLeft text-left">
            {/* Header */}
            <div className="p-6 border-b border-[#1e293b] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white m-0">{selectedCampaign.name}</h3>
                <span className="text-[11px] text-slate-400 mt-1 block">Campaign Logs & Delivery Audits</span>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="w-8 h-8 rounded-xl hover:bg-[#1e293b] border border-transparent hover:border-[#334155] flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Campaign Summary Widget */}
            <div className="p-6 border-b border-[#1e293b] bg-[#1e293b]/10 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-[#1e293b]/40 rounded-xl p-3">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Recipients</span>
                  <span className="text-base font-bold text-white mt-1 block">{selectedCampaign.sent_count}</span>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
                  <span className="block text-[9px] font-bold text-emerald-400 uppercase tracking-wide">Success</span>
                  <span className="text-base font-bold text-emerald-400 mt-1 block">{selectedCampaign.delivered_count}</span>
                </div>
                <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-3">
                  <span className="block text-[9px] font-bold text-rose-400 uppercase tracking-wide">Failed</span>
                  <span className="text-base font-bold text-rose-400 mt-1 block">{selectedCampaign.failed_count}</span>
                </div>
              </div>
            </div>

            {/* Logs List Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide m-0">Individual Logs</h4>
              
              {loadingLogs ? (
                <div className="py-24 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
                </div>
              ) : campaignLogs.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-12 m-0">No logs found for this campaign.</p>
              ) : (
                <div className="space-y-2.5">
                  {campaignLogs.map(l => (
                    <div
                      key={l.id}
                      className={`flex flex-col gap-2 p-3 rounded-xl bg-[#1e293b]/10 border text-xs font-medium ${
                        l.status === 'sent' ? 'border-[#1e293b]' : 'border-rose-900/30 bg-rose-950/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-200 m-0">{l.customer_name}</p>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{l.customer_phone}</span>
                        </div>
                        {l.status === 'sent' ? (
                          <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                            Delivered
                          </span>
                        ) : (
                          <span className="text-[9px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-bold">
                            Failed
                          </span>
                        )}
                      </div>
                      {l.error_message && (
                        <div className="border-t border-[#1e293b] pt-1.5 text-[10px] text-rose-400 font-mono">
                          Error: {l.error_message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Marketing;
