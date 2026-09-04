import React, { useState, useEffect } from 'react';
import { cctvApi } from '../api/cctv';
import type { Camera, CameraDetail, CVTrack, CCTVPlateDetection } from '../api/cctv';
import { casesApi } from '../api/cases';
import type { CaseListItem } from '../types/api';
import { CameraMap } from '../components/cctv/CameraMap';
import { CameraGrid } from '../components/cctv/CameraGrid';
import { CameraInspector } from '../components/cctv/CameraInspector';
import { FeedViewer } from '../components/cctv/FeedViewer';
import { RefreshCw, Play, AlertTriangle, Layers, CreditCard } from 'lucide-react';

export const CCTVCommandCenterPage: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [cameraDetail, setCameraDetail] = useState<CameraDetail | null>(null);
  
  const [isSyncing, setIsSyncing] = useState(false);

  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>('');
  const [tracks, setTracks] = useState<CVTrack[]>([]);
  const [plates, setPlates] = useState<CCTVPlateDetection[]>([]);
  const [isStartingJob, setIsStartingJob] = useState(false);

  useEffect(() => {
    fetchCameras();
    fetchCases();
  }, []);

  useEffect(() => {
    if (selectedCameraId) {
      cctvApi.getCameraDetail(selectedCameraId)
        .then(data => setCameraDetail(data))
        .catch(err => console.error(err));
    } else {
      setCameraDetail(null);
    }
  }, [selectedCameraId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (jobId && jobStatus !== 'COMPLETED' && jobStatus !== 'FAILED') {
      interval = setInterval(() => {
        cctvApi.getSearchJob(jobId)
          .then(data => {
            setJobStatus(data.status);
            if (data.status === 'COMPLETED') {
              fetchTracks(jobId);
            }
          })
          .catch(err => console.error(err));
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [jobId, jobStatus]);

  const fetchCameras = () => {
    cctvApi.listCameras()
      .then(data => {
        setCameras(data);
        if (data.length > 0 && !selectedCameraId) {
          setSelectedCameraId(data[0].camera_id);
        }
      })
      .catch(err => console.error(err));
  };

  const fetchCases = () => {
    casesApi.listCases()
      .then(data => {
        setCases(data);
        if (data.length > 0 && !selectedCaseId) {
          setSelectedCaseId(data[0].case_id);
        }
      })
      .catch(err => console.error(err));
  };

  const fetchTracks = (id: string) => {
    cctvApi.getJobTracks(id)
      .then(data => setTracks(data))
      .catch(err => console.error(err));

    cctvApi.getJobPlates(id)
      .then(data => setPlates(data))
      .catch(err => console.error(err));
  };

  const syncRegistry = () => {
    setIsSyncing(true);
    cctvApi.syncRegistry()
      .then(() => {
        fetchCameras();
      })
      .catch(err => {
        console.error(err);
        alert('Failed to sync registry.');
      })
      .finally(() => setIsSyncing(false));
  };

  const startJob = () => {
    if (!selectedCameraId || !selectedCaseId) return;
    setIsStartingJob(true);
    setJobId(null);
    setTracks([]);
    setPlates([]);
    
    cctvApi.startSearchJob({
      case_id: selectedCaseId,
      camera_ids: [selectedCameraId],
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString()
    }).then(data => {
      setJobId(data.job_id);
      setJobStatus(data.status);
    }).catch(err => {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to start job.');
    }).finally(() => {
      setIsStartingJob(false);
    });
  };

  const liveCount = cameras.filter(c => c.status === 'LIVE' || c.status === 'REGISTERED_ONLY').length;

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans p-4 sm:p-5 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0b0e17] border border-[#151d2a] rounded px-4 py-3 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#BD3535]"></span>
            CCTV Command Center
          </h1>
          <p className="text-slate-400 text-[11px]">Public Camera Network & Vehicle Intelligence</p>
        </div>
        
        <div className="mt-2 sm:mt-0 flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Case Context:</span>
            <select 
              className="border border-[#151d2a] rounded text-xs py-1 px-2.5 bg-[#0e131d] text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#BD3535] shadow-sm max-w-xs"
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
            >
              <option value="">-- Select Active Case --</option>
              {cases.map(c => (
                <option key={c.case_id} value={c.case_id}>{c.case_number} - {c.title}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={syncRegistry}
            disabled={isSyncing}
            className="flex items-center bg-[#0e131d] hover:bg-[#151d2a] border border-[#151d2a] text-slate-200 px-2.5 py-1 rounded text-xs font-semibold shadow-sm transition-colors"
          >
            <RefreshCw size={12} className={`mr-1 text-slate-400 ${isSyncing ? 'animate-spin text-[#BD3535]' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Registry'}
          </button>
        </div>
      </div>

      {/* Metric Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="civix-panel px-3.5 py-2.5">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Registered Cameras</p>
          <p className="text-lg font-bold text-white mt-0.5">{cameras.length}</p>
        </div>
        <div className="civix-panel px-3.5 py-2.5">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Live / Reachable</p>
          <p className="text-lg font-bold text-emerald-400 mt-0.5">{liveCount}</p>
        </div>
        <div className="civix-panel px-3.5 py-2.5">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Verified Sources</p>
          <p className="text-lg font-bold text-white mt-0.5">2</p>
        </div>
        <div className="civix-panel px-3.5 py-2.5">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Selected Camera</p>
          <p className="text-xs font-semibold text-slate-200 truncate mt-1">
            {cameraDetail ? cameraDetail.camera.display_name : 'None Selected'}
          </p>
        </div>
      </div>

      {/* Main Split Screen Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
        {/* Left Column: Interactive Map */}
        <div className="xl:col-span-7 civix-panel p-3 flex flex-col h-[500px]">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center">
              <Layers size={13} className="mr-1.5 text-slate-400" />
              Camera Network Map
            </span>
            <span className="text-[10px] font-mono text-slate-500">OpenStreetMap Free Tile Layer</span>
          </div>
          <div className="flex-1 w-full h-full min-h-0 rounded overflow-hidden border border-[#151d2a]">
            <CameraMap 
              cameras={cameras} 
              selectedCameraId={selectedCameraId}
              onCameraSelect={setSelectedCameraId}
            />
          </div>
        </div>

        {/* Right Column: Inspector & Feed Viewer */}
        <div className="xl:col-span-5 flex flex-col space-y-3 h-[500px]">
          {/* Camera Inspector Box */}
          <div className="civix-panel p-3 flex-shrink-0">
            <h2 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1.5">Camera Inspector</h2>
            <CameraInspector cameraData={cameraDetail} />
          </div>

          {/* Large Feed Viewer Box */}
          <div className="civix-panel p-3 flex-1 flex flex-col min-h-0">
            <h2 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1.5">Feed Stream Viewer</h2>
            
            <FeedViewer cameraData={cameraDetail} />

            {/* Launch Search Control Bar */}
            <div className="mt-2.5 pt-2 border-t border-[#151d2a] flex items-center justify-between flex-shrink-0">
              <button
                onClick={startJob}
                disabled={!selectedCameraId || !selectedCaseId || isStartingJob}
                className="flex items-center bg-[#BD3535] hover:bg-[#a32a2a] text-white px-3 py-1.5 rounded text-xs font-semibold shadow transition-colors disabled:bg-slate-800 disabled:text-slate-500 cursor-pointer"
              >
                <Play size={13} className="mr-1.5 fill-current" />
                {isStartingJob ? 'Initiating Search...' : 'Start Vehicle Search'}
              </button>

              {(!selectedCameraId || !selectedCaseId) && (
                <div className="flex items-center text-[10px] text-amber-300 font-medium bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
                  <AlertTriangle size={11} className="mr-1 text-amber-400" />
                  {!selectedCaseId ? 'Select Case first' : 'Select a camera pin'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Directory Grid & Search Tracking */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
        {/* Camera Directory Grid */}
        <div className="xl:col-span-8 min-h-[320px]">
          <CameraGrid 
            cameras={cameras}
            selectedCameraId={selectedCameraId}
            onCameraSelect={setSelectedCameraId}
          />
        </div>

        {/* CV Search Job Track Status Panel */}
        <div className="xl:col-span-4 civix-panel p-3 min-h-[320px] flex flex-col">
          <div className="flex items-center justify-between mb-2 border-b border-[#151d2a] pb-1.5">
            <h2 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Search Job Output</h2>
            {jobStatus && (
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                jobStatus === 'COMPLETED' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800' : 
                jobStatus === 'FAILED' ? 'bg-red-950/60 text-red-300 border-red-800' : 
                'bg-amber-950/60 text-amber-300 border-amber-800 animate-pulse'
              }`}>
                {jobStatus}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto bg-[#07090e] rounded border border-[#151d2a] p-2.5 space-y-3">
            {jobId ? (
              (tracks.length > 0 || plates.length > 0) ? (
                <div className="space-y-3">
                  {/* Plate OCR Signals */}
                  {plates.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center">
                        <CreditCard size={11} className="mr-1 text-slate-400" />
                        Plate Signals ({plates.length})
                      </p>
                      <div className="space-y-2">
                        {plates.map(plate => (
                          <div key={plate.plate_detection_id} className="bg-[#0e131d] border border-[#151d2a] rounded p-2.5 shadow-sm space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-white bg-[#151d2a] px-1.5 py-0.5 rounded border border-[#26354a]">
                                {plate.normalized_plate}
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-950/60 text-blue-300 rounded uppercase border border-blue-800">
                                OCR CANDIDATE
                              </span>
                            </div>
                            <div className="grid grid-cols-2 text-[10px] text-slate-400 pt-1 border-t border-[#151d2a]">
                              <div>
                                <span className="text-slate-500">Raw OCR: </span>
                                <span className="font-mono text-slate-300">{plate.raw_ocr_text}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-slate-500">Confidence: </span>
                                <span className={`font-bold ${
                                  plate.confidence_category === 'HIGH' ? 'text-emerald-400' :
                                  plate.confidence_category === 'MEDIUM' ? 'text-amber-400' : 'text-red-400'
                                }`}>
                                  {plate.confidence_category} ({(plate.ocr_confidence * 100).toFixed(0)}%)
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vehicle Tracks */}
                  {tracks.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                        Vehicle Tracks ({tracks.length})
                      </p>
                      <div className="space-y-2">
                        {tracks.map(track => (
                          <div key={track.track_id} className="bg-[#0e131d] border border-[#151d2a] rounded p-2 shadow-sm flex items-center justify-between">
                            <div>
                              <p className="text-xs font-semibold text-white">Vehicle Track Detected</p>
                              <p className="text-[10px] font-mono text-slate-400 mt-0.5">ID: {track.track_id.split('-')[0]}</p>
                              <p className="text-[10px] text-slate-500">{new Date(track.first_seen).toLocaleTimeString()}</p>
                            </div>
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-[#151d2a] text-slate-300 border border-[#26354a] rounded uppercase">
                              Track Crop
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center p-3">
                  {jobStatus === 'COMPLETED' ? (
                    <span>No vehicle tracks or plate signals identified in selected interval.</span>
                  ) : (
                    <span className="animate-pulse font-medium text-slate-400">Processing frames with YOLOv8 & OCR engine...</span>
                  )}
                </div>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center p-3">
                <p className="font-medium text-slate-400 mb-1">No Active Search Job</p>
                <p className="text-[10px] text-slate-500">Select a camera pin and an active case context, then click "Start Vehicle Search".</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
