import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProjectService } from './project.service';
import { environment } from '../../../environments/environment';
import { Project } from '../../shared/models';

describe('ProjectService', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;

  const mockProject: Project = {
    id: 1, name: 'Test Project', key: 'TST', status: 'ACTIVE',
    color: '#6366f1', description: 'A test project',
    owner: { id: 1, email: 'owner@test.com', username: 'owner', fullName: 'Owner User' },
    members: [], taskCount: 0,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProjectService]
    });
    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should GET projects', () => {
    const mockPage = { content: [mockProject], page: 0, size: 20, totalElements: 1, totalPages: 1, first: true, last: true };

    service.getProjects().subscribe(res => {
      expect(res.content.length).toBe(1);
      expect(res.content[0].name).toBe('Test Project');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/projects?page=0&size=20`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should GET a single project', () => {
    service.getProject(1).subscribe(project => {
      expect(project.id).toBe(1);
      expect(project.key).toBe('TST');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/projects/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProject);
  });

  it('should POST to create a project', () => {
    const createReq = { name: 'New Project', key: 'NEW', color: '#6366f1' };

    service.createProject(createReq).subscribe(project => {
      expect(project.name).toBe('Test Project');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/projects`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createReq);
    req.flush(mockProject);
  });

  it('should DELETE a project', () => {
    service.deleteProject(1).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/projects/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should POST to invite a member', () => {
    service.inviteMember(1, 'user@test.com', 'MEMBER').subscribe(project => {
      expect(project.id).toBe(1);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/projects/1/members`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'user@test.com', role: 'MEMBER' });
    req.flush(mockProject);
  });
});
